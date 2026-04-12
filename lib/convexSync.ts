"use client";

import type { CoilOrder } from "./coilEngine";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

/**
 * Fire-and-forget sync to Convex.
 * Works without React hooks — uses HTTP API directly.
 * Fails silently if Convex isn't configured.
 */
async function convexMutation(name: string, args: Record<string, unknown>) {
  if (!CONVEX_URL) return;
  try {
    await fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name, args, format: "json" }),
    });
  } catch {
    // Silent — Convex sync is best-effort
  }
}

async function convexQuery(name: string, args: Record<string, unknown>) {
  if (!CONVEX_URL) return null;
  try {
    const res = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: name, args, format: "json" }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.value ?? data;
  } catch {
    return null;
  }
}

// ─── User sync ──────────────────────────────────────

export async function syncUser(privyId: string, wallet?: string, email?: string, referredByCode?: string) {
  return convexMutation("users:getOrCreate", { privyId, wallet, email, referredByCode });
}

export async function getUser(privyId: string) {
  return convexQuery("users:getByPrivyId", { privyId });
}

export async function getUserByWallet(wallet: string) {
  return convexQuery("users:getByWallet", { wallet });
}

// ─── Order sync ─────────────────────────────────────

export async function syncOrderCreate(wallet: string, order: CoilOrder) {
  // First get or create user
  const user = await convexQuery("users:getByWallet", { wallet });
  if (!user?._id) return;

  return convexMutation("orders:create", {
    userId: user._id,
    wallet,
    inputMint: order.inputMint,
    outputMint: order.outputMint,
    targetPrice: order.targetPrice,
    takeProfitPrice: order.takeProfitPrice,
    stopLossPrice: order.stopLossPrice,
    capitalAmount: order.capitalAmount,
    proximityThreshold: order.proximityThreshold,
    strategy: order.strategy,
    yieldMint: order.yieldMint ?? undefined,
    yieldSymbol: order.yieldSymbol ?? undefined,
    lendTxSignature: order.lendTxSignature ?? undefined,
    triggerJwt: order.triggerJwt ?? undefined,
    dcaSliceCount: order.dcaSliceCount,
    dcaSliceInterval: order.dcaSliceInterval,
  });
}

export async function syncOrderUpdate(wallet: string, localOrderId: string, state: string, extra?: Record<string, unknown>) {
  // Find matching order in Convex by wallet and approximate match
  const activeOrders = await convexQuery("orders:getActive", { wallet });
  if (!Array.isArray(activeOrders) || activeOrders.length === 0) return;
  const order = activeOrders[0]; // Use most recent active order
  if (!order?._id) return;

  return convexMutation("orders:updateState", {
    orderId: order._id,
    state,
    ...extra,
  });
}

export async function syncOrderCancel(wallet: string) {
  const activeOrders = await convexQuery("orders:getActive", { wallet });
  if (!Array.isArray(activeOrders) || activeOrders.length === 0) return;
  const order = activeOrders[0];
  if (!order?._id) return;

  return convexMutation("orders:cancel", { orderId: order._id });
}

// ─── Closed positions ───────────────────────────────

export async function syncClosedPosition(wallet: string, pos: {
  mint: string;
  symbol: string;
  amount: number;
  estimatedUsd: number;
  apy: number;
}) {
  const user = await convexQuery("users:getByWallet", { wallet });
  if (!user?._id) return;

  return convexMutation("positions:recordClosed", {
    userId: user._id,
    wallet,
    ...pos,
  });
}

export async function getClosedPositions(wallet: string) {
  return convexQuery("positions:getClosed", { wallet });
}

// ─── Points ─────────────────────────────────────────

export async function awardPoints(wallet: string, action: string, description: string) {
  const user = await convexQuery("users:getByWallet", { wallet });
  if (!user?._id) return;
  return convexMutation("points:award", { userId: user._id, wallet, action, description });
}

export async function getPoints(wallet: string) {
  return convexQuery("points:getTotal", { wallet });
}

// ─── Referral ───────────────────────────────────────

export async function getReferralStats(wallet: string) {
  const user = await convexQuery("users:getByWallet", { wallet });
  if (!user?._id) return null;
  return convexQuery("users:getReferralStats", { userId: user._id });
}
