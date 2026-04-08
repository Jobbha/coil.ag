"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoilOrder } from "./coilEngine";
import { evaluateTransition, applyTransition, updateSpot } from "./coilEngine";

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

export function useCoilEngine(initialOrders: CoilOrder[]) {
  const [orders, setOrders] = useState<CoilOrder[]>(initialOrders);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastFetchRef = useRef<number>(0);
  const hydrated = useRef(false);

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

  // Price polling + state machine loop
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

  return { orders, activeOrder, addOrder, removeOrder };
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
