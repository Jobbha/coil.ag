// Jupiter Lend jlToken integration
// jlTokens are yield-bearing receipt tokens from Jupiter Lend.
// Jupiter Swap routing natively supports jlToken → any token swaps,
// meaning we can earn yield AND swap out in a single transaction.

/** Known jlToken mints and their underlying assets */
export const JL_TOKENS: Record<string, {
  jlMint: string;
  assetMint: string;
  symbol: string;
  jlSymbol: string;
  decimals: number;
}> = {
  USDC: {
    jlMint: "9BEcn9aPEmhSPbPQeFGjidRiEKki46fVQDyPpSQXPA2D",
    assetMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    symbol: "USDC",
    jlSymbol: "jlUSDC",
    decimals: 6,
  },
  SOL: {
    jlMint: "2uQsyo1fXXQkDtcpXnLofWy88PxcvnfH2L8FPSE62FVU",
    assetMint: "So11111111111111111111111111111111111111112",
    symbol: "SOL",
    jlSymbol: "jlWSOL",
    decimals: 9,
  },
  USDT: {
    jlMint: "Cmn4v2wipYV41dkakDvCgFJpxhtaaKt11NyWV8pjSE8A",
    assetMint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
    symbol: "USDT",
    jlSymbol: "jlUSDT",
    decimals: 6,
  },
  JupUSD: {
    jlMint: "7GxATsNMnaC88vdwd2t3mwrFuQwwGvmYPrUQ4D6FotXk",
    assetMint: "JuprjznTrTSp2UFa3ZBUFgwdAmtZCq4MQCwysN55USD",
    symbol: "JupUSD",
    jlSymbol: "jlJupUSD",
    decimals: 6,
  },
  USDS: {
    jlMint: "j14XLJZSVMcUYpAfajdZRpnfHUpJieZHS4aPektLWvh",
    assetMint: "USDSwr9ApdHk5bvJKMjzff41FfuX8bSxdKcR81vTwcA",
    symbol: "USDS",
    jlSymbol: "jlUSDS",
    decimals: 6,
  },
  USDG: {
    jlMint: "9fvHrYNw1A8Evpcj7X2yy4k4fT7nNHcA9L6UsamNHAif",
    assetMint: "2u1tszSeqZ3qBWF3uNGPFc8TzMk2tdiwknnRMWGWjGWH",
    symbol: "USDG",
    jlSymbol: "jlUSDG",
    decimals: 6,
  },
  EURC: {
    jlMint: "GcV9tEj62VncGithz4o4N9x6HWXARxuRgEAYk9zahNA8",
    assetMint: "HzwqbKZw8HxMN6bF2yFZNrht3c2iXXzpKcFu7uBEDKtr",
    symbol: "EURC",
    jlSymbol: "jlEURC",
    decimals: 6,
  },
};

/** Get jlToken info by underlying asset mint */
export function getJlToken(assetMint: string) {
  return Object.values(JL_TOKENS).find((t) => t.assetMint === assetMint);
}

/** Get jlToken info by jl mint address */
export function getJlTokenByMint(jlMint: string) {
  return Object.values(JL_TOKENS).find((t) => t.jlMint === jlMint);
}

/**
 * The Coil flow using jlTokens:
 *
 * 1. DEPOSIT: User deposits USDC → mint jlUSDC via Jupiter Lend
 *    - POST /lend/v1/earn/deposit { asset: USDC_MINT, amount, signer }
 *    - User now holds jlUSDC which auto-appreciates (yield accrues in token price)
 *
 * 2. EARN: jlUSDC sits in wallet, value increases as Lend vault earns
 *    - No action needed — yield is embedded in jlToken exchange rate
 *    - convertToAssets rate increases over time
 *
 * 3. EXECUTE: When price target is hit, swap jlUSDC → target token in ONE tx
 *    - Jupiter Swap routing handles jlToken redemption internally
 *    - GET /swap/v2/order?inputMint=jlUSDC_MINT&outputMint=SOL_MINT&amount=...
 *    - This routes: jlUSDC → redeem → USDC → swap → SOL (all in one tx!)
 *
 * 4. OTOCO: For TP/SL, after the swap fills, place Trigger orders on the output
 *    - POST /trigger/v2/orders/price (with TP and SL prices)
 *
 * Benefits over old flow:
 * - Earn yield until the EXACT moment of execution (no withdrawal delay)
 * - Single transaction for exit (vs 3 separate txs)
 * - Accumulated yield is captured in the swap (jlUSDC is worth more than deposited USDC)
 */
export type CoilJlFlow = {
  step: "mint" | "earning" | "executing" | "placing_tp_sl" | "done";
  jlMint: string;
  jlAmount: string; // jlToken amount held
  estimatedYield: number; // USD yield accrued based on exchange rate change
};
