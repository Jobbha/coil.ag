/* eslint-disable */
// Stub file — replaced by `npx convex dev` when connected
import type { FilterApi, FunctionReference } from "convex/server";

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;

export declare const api: {
  users: {
    getOrCreate: FunctionReference<"mutation", "public", any, any>;
    getByPrivyId: FunctionReference<"query", "public", any, any>;
    getByWallet: FunctionReference<"query", "public", any, any>;
    getReferralStats: FunctionReference<"query", "public", any, any>;
  };
  orders: {
    create: FunctionReference<"mutation", "public", any, any>;
    updateState: FunctionReference<"mutation", "public", any, any>;
    cancel: FunctionReference<"mutation", "public", any, any>;
    getActive: FunctionReference<"query", "public", any, any>;
    getHistory: FunctionReference<"query", "public", any, any>;
    getByUser: FunctionReference<"query", "public", any, any>;
  };
  positions: {
    recordClosed: FunctionReference<"mutation", "public", any, any>;
    getClosed: FunctionReference<"query", "public", any, any>;
  };
};
