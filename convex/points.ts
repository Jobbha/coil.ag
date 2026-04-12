import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Point values for each action
const POINT_VALUES = {
  first_order: 100,    // First order ever placed
  order_placed: 25,    // Each subsequent order
  referral: 50,        // Each successful referral
  yield_milestone: 10, // Every $1 of yield earned
};

// Award points for an action
export const award = mutation({
  args: {
    userId: v.id("users"),
    wallet: v.string(),
    action: v.string(),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const amount = POINT_VALUES[args.action as keyof typeof POINT_VALUES] ?? 0;
    if (amount === 0) return;

    await ctx.db.insert("points", {
      userId: args.userId,
      wallet: args.wallet,
      action: args.action,
      amount,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

// Get total points for a wallet
export const getTotal = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const entries = await ctx.db
      .query("points")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .collect();

    const total = entries.reduce((s, e) => s + e.amount, 0);

    return {
      total,
      breakdown: {
        orders: entries.filter((e) => e.action === "order_placed" || e.action === "first_order").reduce((s, e) => s + e.amount, 0),
        referrals: entries.filter((e) => e.action === "referral").reduce((s, e) => s + e.amount, 0),
        yield: entries.filter((e) => e.action === "yield_milestone").reduce((s, e) => s + e.amount, 0),
      },
      history: entries.slice(-20).reverse(),
    };
  },
});
