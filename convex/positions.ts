import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Record a closed/withdrawn position
export const recordClosed = mutation({
  args: {
    userId: v.id("users"),
    wallet: v.string(),
    mint: v.string(),
    symbol: v.string(),
    amount: v.number(),
    estimatedUsd: v.number(),
    apy: v.number(),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("closedPositions", {
      ...args,
      closedAt: Date.now(),
    });
  },
});

// Get closed positions for a wallet
export const getClosed = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("closedPositions")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .collect();
  },
});
