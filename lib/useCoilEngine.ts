"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoilOrder } from "./coilEngine";
import { evaluateTransition, applyTransition, updateSpot } from "./coilEngine";
import { getJlToken } from "./jlTokens";

const POLL_INTERVAL_MS = 10_000;
const STORAGE_KEY = "coil-orders";

function loadOrders(): CoilOrder[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CoilOrder[];
  } catch {
    return [];
  }
}

function saveOrders(orders: CoilOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch { /* quota exceeded etc */ }
}

/** Auto-execute: swap jlToken → target token when price hits threshold */
async function autoExecuteSwap(
  order: CoilOrder,
  walletAddress: string,
  signAndSend: (txBase64: string) => Promise<string>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const jlToken = order.yieldMint ? { jlMint: order.yieldMint } : getJlToken(order.inputMint);
    const inputMint = jlToken?.jlMint ?? order.inputMint;

    const qs = new URLSearchParams({
      inputMint,
      outputMint: order.outputMint,
      amount: order.capitalAmount,
      taker: walletAddress,
      slippageBps: "100",
    });

    const res = await fetch(`/api/swap-quote?${qs}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || `Swap quote failed (${res.status})` };
    }

    const data = await res.json();
    if (!data.swapTransaction) {
      return { success: false, error: "No swap transaction returned" };
    }

    await signAndSend(data.swapTransaction);
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Swap failed";
    if (msg.includes("User rejected") || msg.includes("cancelled")) {
      return { success: false, error: "User rejected" };
    }
    return { success: false, error: msg };
  }
}

interface EngineOptions {
  walletAddress?: string | null;
  signAndSend?: (txBase64: string) => Promise<string>;
}

export function useCoilEngine(initialOrders: CoilOrder[], options?: EngineOptions) {
  const [orders, setOrders] = useState<CoilOrder[]>(initialOrders);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastFetchRef = useRef<number>(0);
  const hydrated = useRef(false);
  const executingRef = useRef<Set<string>>(new Set());

  // Store options in ref so effect doesn't re-run on every render
  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Load from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      const saved = loadOrders();
      if (saved.length > 0) setOrders(saved);
    }
  }, []);

  // Persist to localStorage on every change (skip initial render)
  useEffect(() => {
    if (hydrated.current) saveOrders(orders);
  }, [orders]);

  const addOrder = useCallback((order: CoilOrder) => {
    const started: CoilOrder = { ...order, state: "LENDING", updatedAt: Date.now() };
    setOrders((prev) => [started, ...prev]);
  }, []);

  const removeOrder = useCallback((orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  const updateOrder = useCallback((orderId: string, updates: Partial<CoilOrder>) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, ...updates, updatedAt: Date.now() } : o)),
    );
  }, []);

  // Price polling + state machine loop + auto-execution
  useEffect(() => {
    async function tick() {
      const now = Date.now();
      if (now - lastFetchRef.current < 8_000) return;
      lastFetchRef.current = now;

      setOrders((prev) => {
        const activeMints = new Set<string>();
        for (const o of prev) {
          if (["LENDING", "APPROACHING", "PLACED"].includes(o.state)) {
            activeMints.add(o.outputMint);
          }
        }
        if (activeMints.size === 0) return prev;

        fetchPrices([...activeMints]).then((prices) => {
          if (Object.keys(prices).length === 0) return;

          setOrders((current) =>
            current.map((order) => {
              const price = prices[order.outputMint];
              if (!price) return order;

              let updated = updateSpot(order, price);

              // Yield accrues while capital is in Lend
              if (updated.state === "LENDING" || updated.state === "APPROACHING") {
                const elapsed = (Date.now() - updated.createdAt) / 1000;
                const capitalUsd = parseInt(updated.capitalAmount) / 1e6;
                const annualYield = capitalUsd * 0.05;
                updated = {
                  ...updated,
                  yieldEarned: (annualYield * elapsed) / (365 * 24 * 3600),
                };
              }

              const transition = evaluateTransition(updated);
              if (transition) {
                updated = applyTransition(updated, transition);

                // Auto-execute when transitioning to APPROACHING
                if (
                  transition.to === "APPROACHING" &&
                  optionsRef.current?.walletAddress &&
                  optionsRef.current?.signAndSend &&
                  !executingRef.current.has(order.id)
                ) {
                  executingRef.current.add(order.id);
                  const wallet = optionsRef.current.walletAddress;
                  const signAndSend = optionsRef.current.signAndSend;

                  autoExecuteSwap(updated, wallet, signAndSend).then((result) => {
                    executingRef.current.delete(order.id);
                    if (result.success) {
                      setOrders((cur) =>
                        cur.map((o) =>
                          o.id === order.id
                            ? { ...o, state: "FILLED", updatedAt: Date.now() }
                            : o,
                        ),
                      );
                    } else if (result.error !== "User rejected") {
                      // Stay in APPROACHING, will retry on next tick
                      console.warn(`Auto-execute failed for ${order.id}: ${result.error}`);
                    }
                  });
                }
              }

              return updated;
            }),
          );
        });

        return prev;
      });
    }

    tick();
    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [orders.length]);

  const activeOrder = orders.find((o) =>
    ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
  );

  return { orders, activeOrder, addOrder, removeOrder, updateOrder };
}

async function fetchPrices(mints: string[]): Promise<Record<string, number>> {
  try {
    const res = await fetch(`/api/price?ids=${mints.join(",")}`);
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, number> = {};
    for (const [mint, info] of Object.entries(data)) {
      if (info && typeof info === "object" && "usdPrice" in info) {
        out[mint] = (info as { usdPrice: number }).usdPrice;
      }
    }
    return out;
  } catch {
    return {};
  }
}
