import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Get or create user by Privy ID
export const getOrCreate = mutation({
  args: {
    privyId: v.string(),
    wallet: v.optional(v.string()),
    email: v.optional(v.string()),
    referredByCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_privy", (q) => q.eq("privyId", args.privyId))
      .first();

    if (existing) {
      // Update wallet/email if changed
      if (args.wallet && args.wallet !== existing.wallet) {
        await ctx.db.patch(existing._id, { wallet: args.wallet });
      }
      if (args.email && args.email !== existing.email) {
        await ctx.db.patch(existing._id, { email: args.email });
      }
      return existing._id;
    }

    // Look up referrer
    let referredBy: string | undefined;
    if (args.referredByCode) {
      const code = args.referredByCode;
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referral", (q) => q.eq("referralCode", code))
        .first();
      if (referrer) referredBy = code;
    }

    const userId = await ctx.db.insert("users", {
      privyId: args.privyId,
      wallet: args.wallet,
      email: args.email,
      referralCode: generateReferralCode(),
      referredBy,
      totalYieldEarned: 0,
      totalOrdersPlaced: 0,
      createdAt: Date.now(),
    });

    // Track referral
    if (referredBy) {
      const referrer = await ctx.db
        .query("users")
        .withIndex("by_referral", (q) => q.eq("referralCode", referredBy))
        .first();
      if (referrer) {
        await ctx.db.insert("referrals", {
          referrerId: referrer._id,
          referredId: userId,
          referralCode: referredBy,
          createdAt: Date.now(),
        });
      }
    }

    return userId;
  },
});

// Get user profile
export const getByPrivyId = query({
  args: { privyId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_privy", (q) => q.eq("privyId", args.privyId))
      .first();
  },
});

// Get user by wallet
export const getByWallet = query({
  args: { wallet: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("users")
      .withIndex("by_wallet", (q) => q.eq("wallet", args.wallet))
      .first();
  },
});

// Get referral stats
export const getReferralStats = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const referrals = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .collect();
    return {
      count: referrals.length,
      referrals,
    };
  },
});
