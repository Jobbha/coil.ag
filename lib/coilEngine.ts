// Coil State Machine
// IDLE → LENDING → APPROACHING → PLACED → FILLED | EXPIRED → LENDING (cycle)

export type CoilState =
  | "IDLE"
  | "LENDING"
  | "APPROACHING"
  | "WITHDRAWING"
  | "PLACED"
  | "FILLED"
  | "EXPIRED"
  | "ERROR";

export interface CoilOrder {
  id: string;
  // User inputs
  inputMint: string; // token used as capital (e.g. USDC)
  outputMint: string; // token to buy
  targetPrice: number; // desired entry price
  takeProfitPrice: number;
  stopLossPrice: number;
  capitalAmount: string; // in smallest unit
  proximityThreshold: number; // e.g. 0.03 = 3%

  // jlToken yield config
  yieldMint: string | null; // jlToken mint (e.g. jlUSDC) — null means no yield
  yieldSymbol: string | null; // e.g. "jlUSDC"
  strategy: "limit" | "dca" | "perps" | "predict";

  // Yield compounding
  compoundYield?: boolean; // true = yield added to buy, false = yield kept as stablecoin

  // DCA-specific fields
  dcaSliceCount?: number;
  dcaSliceInterval?: number; // ms between slices
  dcaSlicesExecuted?: number;
  dcaLastSliceAt?: number;

  // Runtime state
  state: CoilState;
  spotPrice: number | null;
  distancePct: number | null; // how far spot is from target (signed)
  yieldEarned: number; // in USD
  lendTxSignature: string | null;
  triggerJwt: string | null;
  triggerOrderId: string | null;
  createdAt: number;
  updatedAt: number;
  error: string | null;
}

export function createOrder(params: {
  inputMint: string;
  outputMint: string;
  targetPrice: number;
  takeProfitPrice: number;
  stopLossPrice: number;
  capitalAmount: string;
  proximityThreshold: number;
  yieldMint?: string | null;
  yieldSymbol?: string | null;
  strategy?: "limit" | "dca" | "perps" | "predict";
}): CoilOrder {
  return {
    id: crypto.randomUUID(),
    inputMint: params.inputMint,
    outputMint: params.outputMint,
    targetPrice: params.targetPrice,
    takeProfitPrice: params.takeProfitPrice,
    stopLossPrice: params.stopLossPrice,
    capitalAmount: params.capitalAmount,
    proximityThreshold: params.proximityThreshold,
    yieldMint: params.yieldMint ?? null,
    yieldSymbol: params.yieldSymbol ?? null,
    strategy: params.strategy ?? "limit",
    state: "IDLE",
    spotPrice: null,
    distancePct: null,
    yieldEarned: 0,
    lendTxSignature: null,
    triggerJwt: null,
    triggerOrderId: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    error: null,
  };
}

/** Calculate % distance from spot to target. Negative = spot below target. */
export function calcDistance(spotPrice: number, targetPrice: number): number {
  return (spotPrice - targetPrice) / targetPrice;
}

/** Should we withdraw from Lend and prepare to place order? */
export function shouldApproach(order: CoilOrder): boolean {
  if (order.state !== "LENDING" || order.distancePct === null) return false;
  // Trigger when spot is within the threshold of the target price
  return Math.abs(order.distancePct) <= order.proximityThreshold;
}

/** Should we go back to lending? (price moved away after approaching) */
export function shouldRetreat(order: CoilOrder): boolean {
  if (order.state !== "APPROACHING" || order.distancePct === null) return false;
  // Give some buffer (2x threshold) before retreating to avoid churn
  return Math.abs(order.distancePct) > order.proximityThreshold * 2;
}

export type StateTransition = {
  from: CoilState;
  to: CoilState;
  reason: string;
};

/**
 * Evaluate the next state transition based on current order state and spot price.
 * Returns null if no transition needed.
 */
export function evaluateTransition(order: CoilOrder): StateTransition | null {
  switch (order.state) {
    case "IDLE":
      return { from: "IDLE", to: "LENDING", reason: "Deposit capital to earn yield" };

    case "LENDING":
      if (shouldApproach(order)) {
        return {
          from: "LENDING",
          to: "APPROACHING",
          reason: `Spot within ${(order.proximityThreshold * 100).toFixed(1)}% of target`,
        };
      }
      return null;

    case "APPROACHING":
      if (shouldRetreat(order)) {
        return {
          from: "APPROACHING",
          to: "LENDING",
          reason: "Price moved away, returning to Lend",
        };
      }
      // Transition to PLACED happens externally after order is submitted
      return null;

    case "PLACED":
      // FILLED and EXPIRED transitions happen via Trigger API polling
      return null;

    case "EXPIRED":
      return {
        from: "EXPIRED",
        to: "LENDING",
        reason: "Order expired, re-depositing to Lend",
      };

    case "FILLED":
      // Terminal state for this cycle
      return null;

    case "ERROR":
      return null;

    default:
      return null;
  }
}

/** Apply a transition to produce the updated order */
export function applyTransition(
  order: CoilOrder,
  transition: StateTransition,
): CoilOrder {
  return {
    ...order,
    state: transition.to,
    updatedAt: Date.now(),
    error: null,
  };
}

/** Update spot price and recalculate distance */
export function updateSpot(order: CoilOrder, spotPrice: number): CoilOrder {
  return {
    ...order,
    spotPrice,
    distancePct: calcDistance(spotPrice, order.targetPrice),
    updatedAt: Date.now(),
  };
}

// ─── Well-known Solana token mints ───────────────────────────

export const KNOWN_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
} as const;
