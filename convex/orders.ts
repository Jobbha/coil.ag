import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Create a new order
export const create = mutation({
  args: {
    userId: v.id("users"),
    wallet: v.string(),
    inputMint: v.string(),
    outputMint: v.string(),
    targetPrice: v.number(),
    takeProfitPrice: v.number(),
    stopLossPrice: v.number(),
    capitalAmount: v.string(),
    proximityThreshold: v.number(),
    strategy: v.string(),
    yieldMint: v.optional(v.string()),
    yieldSymbol: v.optional(v.string()),
    lendTxSignature: v.optional(v.string()),
    triggerJwt: v.optional(v.string()),
    dcaSliceCount: v.optional(v.number()),
    dcaSliceInterval: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      ...args,
      state: "LENDING",
      yieldEarned: 0,
      dcaSlicesExecuted: args.dcaSliceCount ? 0 : undefined,
      dcaLastSliceAt: args.dcaSliceCount ? Date.now() : undefined,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Increment user's order count
    const user = await ctx.db.get(args.userId);
    if (user) {
      await ctx.db.patch(args.userId, {
        totalOrdersPlaced: user.totalOrdersPlaced + 1,
      });
    }

    return orderId;
  },
});

// Update order state
export const updateState = mutation({
  args: {
    orderId: v.id("orders"),
    state: v.string(),
    triggerOrderId: v.optional(v.string()),
    executeTxSignature: v.optional(v.string()),
    yieldEarned: v.optional(v.number()),
    dcaSlicesExecuted: v.optional(v.number()),
    dcaLastSliceAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { orderId, ...updates } = args;
    const order = await ctx.db.get(orderId);
    if (!order) return;

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (updates.state) patch.state = updates.state;
    if (updates.triggerOrderId) patch.triggerOrderId = updates.triggerOrderId;
    if (updates.executeTxSignature) patch.executeTxSignature = updates.executeTxSignature;
    if (updates.yieldEarned !== undefined) patch.yieldEarned = updates.yieldEarned;
    if (updates.dcaSlicesExecuted !== undefined) patch.dcaSlicesExecuted = updates.dcaSlicesExecuted;
    if (updates.dcaLastSliceAt !== undefined) patch.dcaLastSliceAt = updates.dcaLastSliceAt;

    if (updates.state === "FILLED" || updates.state === "CANCELLED" || updates.state === "EXPIRED") {
      patch.closedAt = Date.now();
      // Update user yield stats
      if (order.yieldEarned > 0) {
        const user = await ctx.db.get(order.userId);
        if (user) {
          await ctx.db.patch(order.userId, {
            totalYieldEarned: user.totalYieldEarned + order.yieldEarned,
          });
        }
      }
    }

    await ctx.db.patch(orderId, patch);
  },
});

// Cancel an order
export const cancel = mutation({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.orderId, {
      state: "CANCELLED",
      closedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// Get active orders for a wallet
export const getActive = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("orders")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .collect();
    return all.filter((o) =>
      ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
    );
  },
});

// Get order history for a wallet
export const getHistory = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db
      .query("orders")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .collect();
    return all.filter((o) =>
      ["FILLED", "CANCELLED", "EXPIRED"].includes(o.state),
    );
  },
});

// Get all orders for a user
export const getByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return ctx.db
      .query("orders")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});
