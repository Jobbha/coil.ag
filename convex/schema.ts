import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles linked to Privy
  users: defineTable({
    privyId: v.string(),
    wallet: v.optional(v.string()),
    email: v.optional(v.string()),
    referralCode: v.string(),
    referredBy: v.optional(v.string()),
    totalYieldEarned: v.number(),
    totalOrdersPlaced: v.number(),
    createdAt: v.number(),
  })
    .index("by_privy", ["privyId"])
    .index("by_wallet", ["wallet"])
    .index("by_referral", ["referralCode"]),

  // Orders — the core: limit orders, DCA, etc.
  orders: defineTable({
    userId: v.id("users"),
    wallet: v.string(),
    // Order params
    inputMint: v.string(),
    outputMint: v.string(),
    targetPrice: v.number(),
    takeProfitPrice: v.number(),
    stopLossPrice: v.number(),
    capitalAmount: v.string(),
    proximityThreshold: v.number(),
    strategy: v.string(), // "limit" | "dca" | "perps" | "predict"
    // Yield
    yieldMint: v.optional(v.string()),
    yieldSymbol: v.optional(v.string()),
    // State
    state: v.string(), // IDLE | LENDING | APPROACHING | PLACED | FILLED | EXPIRED | CANCELLED
    // On-chain refs
    lendTxSignature: v.optional(v.string()),
    triggerJwt: v.optional(v.string()),
    triggerOrderId: v.optional(v.string()),
    executeTxSignature: v.optional(v.string()),
    // Yield tracking
    yieldEarned: v.number(),
    // DCA fields
    dcaSliceCount: v.optional(v.number()),
    dcaSliceInterval: v.optional(v.number()),
    dcaSlicesExecuted: v.optional(v.number()),
    dcaLastSliceAt: v.optional(v.number()),
    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    closedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_wallet", ["wallet"])
    .index("by_state", ["state"]),

  // Closed/withdrawn Lend positions (history)
  closedPositions: defineTable({
    userId: v.id("users"),
    wallet: v.string(),
    mint: v.string(),
    symbol: v.string(),
    amount: v.number(),
    estimatedUsd: v.number(),
    apy: v.number(),
    closedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_wallet", ["wallet"]),

  // Referral tracking
  referrals: defineTable({
    referrerId: v.id("users"),
    referredId: v.id("users"),
    referralCode: v.string(),
    createdAt: v.number(),
  })
    .index("by_referrer", ["referrerId"]),

  // Points system — rewards for activity
  points: defineTable({
    userId: v.id("users"),
    wallet: v.string(),
    action: v.string(), // "order_placed", "referral", "yield_earned", "first_order", "streak"
    amount: v.number(), // points awarded
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_wallet", ["wallet"]),
});
