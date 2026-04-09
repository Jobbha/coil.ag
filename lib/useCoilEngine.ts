"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CoilOrder } from "./coilEngine";
import { evaluateTransition, applyTransition, updateSpot } from "./coilEngine";
import { getJlToken } from "./jlTokens";

const POLL_INTERVAL_MS = 10_000;
const TRIGGER_POLL_MS = 30_000;
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

// ─── Auto-execution: swap jlToken → USDC, then place Trigger order ─────

async function autoExecuteWithTrigger(
  order: CoilOrder,
  walletAddress: string,
  signAndSend: (txBase64: string) => Promise<string>,
): Promise<{ success: boolean; triggerOrderId?: string; error?: string }> {
  try {
    const jwt = order.triggerJwt;
    if (!jwt) {
      // No JWT — fall back to direct swap
      return autoExecuteSwap(order, walletAddress, signAndSend);
    }

    // Step 1: Swap jlToken → USDC (redeem from Lend)
    const jlToken = order.yieldMint ? { jlMint: order.yieldMint } : getJlToken(order.inputMint);
    const jlMint = jlToken?.jlMint ?? order.inputMint;

    // If jlMint is different from inputMint, we need to swap back to USDC first
    if (jlMint !== order.inputMint) {
      const swapQs = new URLSearchParams({
        inputMint: jlMint,
        outputMint: order.inputMint,
        amount: order.capitalAmount,
        taker: walletAddress,
        slippageBps: "50",
      });
      const swapRes = await fetch(`/api/swap-quote?${swapQs}`);
      if (!swapRes.ok) {
        const err = await swapRes.json().catch(() => ({}));
        return { success: false, error: err.error || "Failed to get swap quote" };
      }
      const swapData = await swapRes.json();
      if (!swapData.swapTransaction) {
        return { success: false, error: "No swap transaction returned" };
      }
      await signAndSend(swapData.swapTransaction);
    }

    // Step 2: Craft Trigger deposit tx
    const depositRes = await fetch("/api/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "deposit",
        jwt,
        inputMint: order.inputMint,
        amount: order.capitalAmount,
      }),
    });
    if (!depositRes.ok) {
      const err = await depositRes.json().catch(() => ({}));
      return { success: false, error: err.error || "Trigger deposit failed" };
    }
    const { transaction: depositTx } = await depositRes.json();

    // Step 3: Sign the deposit tx
    const signedDepositSig = await signAndSend(depositTx);

    // Step 4: Create the limit order on Jupiter Trigger
    const orderType = order.takeProfitPrice > 0 && order.stopLossPrice > 0 ? "otoco" : "single";
    const orderRes = await fetch("/api/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "order",
        jwt,
        inputMint: order.inputMint,
        outputMint: order.outputMint,
        triggerPrice: order.targetPrice.toString(),
        orderType,
        signedDepositTxn: signedDepositSig,
        ...(orderType === "otoco" && {
          takeProfitPrice: order.takeProfitPrice.toString(),
          stopLossPrice: order.stopLossPrice.toString(),
        }),
      }),
    });

    if (!orderRes.ok) {
      const err = await orderRes.json().catch(() => ({}));
      return { success: false, error: err.error || "Failed to create Trigger order" };
    }

    const orderInfo = await orderRes.json();
    return { success: true, triggerOrderId: orderInfo.orderId };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Trigger execution failed";
    if (msg.includes("User rejected") || msg.includes("cancelled")) {
      return { success: false, error: "User rejected" };
    }
    return { success: false, error: msg };
  }
}

/** Fallback: direct swap jlToken → target token (no Trigger) */
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

/** Verify orders against on-chain jlToken balances — mark stale orders */
async function verifyLendPositions(
  orders: CoilOrder[],
  walletAddress: string,
): Promise<Record<string, { stale: boolean; realYield?: number }>> {
  const results: Record<string, { stale: boolean; realYield?: number }> = {};

  const lendingOrders = orders.filter((o) =>
    ["LENDING", "APPROACHING"].includes(o.state) && o.yieldMint,
  );
  if (lendingOrders.length === 0) return results;

  try {
    // Check jlToken balances directly via RPC (more reliable than Lend API)
    // Also try the Lend positions API as a secondary source
    const [lendRes] = await Promise.all([
      fetch(`/api/lend?action=positions&wallet=${walletAddress}`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]);
    const positions = Array.isArray(lendRes) ? lendRes : [];

    // Build held mints from Lend API
    const heldMints = new Set<string>();
    for (const pos of positions) {
      if (pos.mint) heldMints.add(pos.mint);
    }

    // For orders where Lend API didn't find positions, check on-chain token balance
    for (const order of lendingOrders) {
      const jlMint = order.yieldMint;
      if (!jlMint) continue;

      if (heldMints.has(jlMint)) {
        // Found in Lend API — pull real yield
        const pos = positions.find((p: { mint: string }) => p.mint === jlMint);
        if (pos?.value_usd) {
          const capitalUsd = parseInt(order.capitalAmount) / 1e6;
          results[order.id] = { stale: false, realYield: Math.max(0, pos.value_usd - capitalUsd) };
        }
      } else {
        // Not in Lend API — check if jlToken is still in wallet via RPC
        // Only mark stale if order is older than 2 minutes (give time for tx to confirm)
        const orderAge = Date.now() - order.createdAt;
        if (orderAge < 120_000) continue; // skip very fresh orders

        try {
          const balRes = await fetch(`/api/price?ids=${jlMint}`);
          // If we can't verify, don't mark stale — benefit of the doubt
          if (!balRes.ok) continue;
        } catch {
          continue;
        }

        results[order.id] = { stale: true };
      }
    }
  } catch {
    // Silent fail — don't mark anything stale if verification fails
  }

  return results;
}

/** Poll Jupiter Trigger API for order status updates */
async function pollTriggerStatus(
  orders: CoilOrder[],
): Promise<Record<string, { status: string }>> {
  const updates: Record<string, { status: string }> = {};

  // Group orders by JWT to minimize API calls
  const jwtOrders = orders.filter((o) => o.state === "PLACED" && o.triggerJwt && o.triggerOrderId);
  if (jwtOrders.length === 0) return updates;

  // Use the first JWT (they should all be the same user)
  const jwt = jwtOrders[0].triggerJwt!;

  try {
    const res = await fetch("/api/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "history", jwt }),
    });
    if (!res.ok) return updates;

    const { orders: triggerOrders } = await res.json();
    if (!Array.isArray(triggerOrders)) return updates;

    for (const to of triggerOrders) {
      const match = jwtOrders.find((o) => o.triggerOrderId === to.orderId);
      if (match) {
        if (to.status === "filled" || to.filledAt) {
          updates[match.id] = { status: "FILLED" };
        } else if (to.status === "expired" || to.expiredAt) {
          updates[match.id] = { status: "EXPIRED" };
        } else if (to.status === "cancelled") {
          updates[match.id] = { status: "EXPIRED" };
        }
      }
    }
  } catch {
    // Silent fail — will retry next poll
  }

  return updates;
}

// ─── Engine Hook ────────────────────────────────────────────

interface EngineOptions {
  walletAddress?: string | null;
  signAndSend?: (txBase64: string) => Promise<string>;
}

export function useCoilEngine(initialOrders: CoilOrder[], options?: EngineOptions) {
  const [orders, setOrders] = useState<CoilOrder[]>(initialOrders);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const triggerPollRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const lastFetchRef = useRef<number>(0);
  const hydrated = useRef(false);
  const executingRef = useRef<Set<string>>(new Set());

  const optionsRef = useRef(options);
  optionsRef.current = options;

  // Load from localStorage after mount
  useEffect(() => {
    if (!hydrated.current) {
      hydrated.current = true;
      const saved = loadOrders();
      if (saved.length > 0) setOrders(saved);
    }
  }, []);

  // Persist to localStorage
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

  // On-chain verification — check Lend positions every 30s
  const lastVerifyRef = useRef<number>(0);

  // Price polling + state machine + auto-execution
  useEffect(() => {
    async function tick() {
      const now = Date.now();
      if (now - lastFetchRef.current < 8_000) return;
      lastFetchRef.current = now;

      // Verify on-chain state every 30s
      const wallet = optionsRef.current?.walletAddress;
      if (wallet && now - lastVerifyRef.current > 30_000) {
        lastVerifyRef.current = now;
        verifyLendPositions(orders, wallet).then((results) => {
          if (Object.keys(results).length === 0) return;
          setOrders((cur) =>
            cur.map((o) => {
              const r = results[o.id];
              if (!r) return o;
              if (r.stale) {
                return { ...o, state: "EXPIRED" as const, error: "Position no longer found on-chain", updatedAt: Date.now() };
              }
              if (r.realYield !== undefined) {
                return { ...o, yieldEarned: r.realYield, updatedAt: Date.now() };
              }
              return o;
            }),
          );
        });
      }

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

              // DCA: execute slices on schedule
              if (
                updated.strategy === "dca" &&
                updated.state === "LENDING" &&
                updated.dcaSliceCount &&
                updated.dcaSliceInterval &&
                (updated.dcaSlicesExecuted ?? 0) < updated.dcaSliceCount &&
                Date.now() - (updated.dcaLastSliceAt ?? 0) >= updated.dcaSliceInterval &&
                optionsRef.current?.walletAddress &&
                optionsRef.current?.signAndSend &&
                !executingRef.current.has(order.id)
              ) {
                executingRef.current.add(order.id);
                const wallet = optionsRef.current.walletAddress;
                const sas = optionsRef.current.signAndSend;
                const sliceAmount = Math.floor(
                  parseInt(updated.capitalAmount) / updated.dcaSliceCount,
                ).toString();

                const dcaOrder = { ...updated, capitalAmount: sliceAmount };
                autoExecuteSwap(dcaOrder, wallet, sas).then((result) => {
                  executingRef.current.delete(order.id);
                  if (result.success) {
                    const newSlices = (updated.dcaSlicesExecuted ?? 0) + 1;
                    const done = newSlices >= (updated.dcaSliceCount ?? 1);
                    setOrders((cur) =>
                      cur.map((o) =>
                        o.id === order.id
                          ? {
                              ...o,
                              dcaSlicesExecuted: newSlices,
                              dcaLastSliceAt: Date.now(),
                              state: done ? "FILLED" : "LENDING",
                              updatedAt: Date.now(),
                            }
                          : o,
                      ),
                    );
                  }
                });
              }

              const transition = evaluateTransition(updated);
              if (transition) {
                // Skip APPROACHING transition for DCA orders (they use slice logic above)
                if (updated.strategy === "dca") {
                  // DCA stays in LENDING until all slices done
                } else {
                  updated = applyTransition(updated, transition);
                }

                // Auto-execute when transitioning to APPROACHING (limit orders only)
                if (
                  transition.to === "APPROACHING" &&
                  optionsRef.current?.walletAddress &&
                  optionsRef.current?.signAndSend &&
                  !executingRef.current.has(order.id)
                ) {
                  executingRef.current.add(order.id);
                  const wallet = optionsRef.current.walletAddress;
                  const signAndSend = optionsRef.current.signAndSend;

                  // Use Trigger if JWT available, otherwise direct swap
                  autoExecuteWithTrigger(updated, wallet, signAndSend).then((result) => {
                    executingRef.current.delete(order.id);
                    if (result.success) {
                      setOrders((cur) =>
                        cur.map((o) =>
                          o.id === order.id
                            ? {
                                ...o,
                                state: result.triggerOrderId ? "PLACED" : "FILLED",
                                triggerOrderId: result.triggerOrderId ?? o.triggerOrderId,
                                updatedAt: Date.now(),
                              }
                            : o,
                        ),
                      );
                    } else if (result.error !== "User rejected") {
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

  // Poll Trigger API for PLACED order status updates
  useEffect(() => {
    const placedOrders = orders.filter((o) => o.state === "PLACED" && o.triggerOrderId);
    if (placedOrders.length === 0) return;

    async function pollTrigger() {
      const updates = await pollTriggerStatus(orders);
      if (Object.keys(updates).length > 0) {
        setOrders((cur) =>
          cur.map((o) => {
            const update = updates[o.id];
            if (!update) return o;
            return { ...o, state: update.status as CoilOrder["state"], updatedAt: Date.now() };
          }),
        );
      }
    }

    pollTrigger();
    triggerPollRef.current = setInterval(pollTrigger, TRIGGER_POLL_MS);
    return () => {
      if (triggerPollRef.current) clearInterval(triggerPollRef.current);
    };
  }, [orders.filter((o) => o.state === "PLACED").length]);

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
