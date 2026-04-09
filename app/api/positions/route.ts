import { NextRequest, NextResponse } from "next/server";
import { isValidAddress } from "@/lib/validation";
import { JL_TOKENS } from "@/lib/jlTokens";

const HELIUS_RPC = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

/**
 * GET /api/positions?wallet=...
 *
 * Checks the user's wallet for jlToken balances directly via RPC.
 * More reliable than Jupiter Lend API which often returns empty.
 * Returns active Lend positions with amount, USD value, APY.
 */
export async function GET(req: NextRequest) {
  const wallet = req.nextUrl.searchParams.get("wallet");
  if (!wallet || !isValidAddress(wallet)) {
    return NextResponse.json({ error: "Valid wallet address required" }, { status: 400 });
  }

  try {
    // Get token accounts from BOTH SPL Token and Token-2022 programs
    const [splRes, t22Res] = await Promise.all([
      fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1, method: "getTokenAccountsByOwner",
          params: [wallet, { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" }, { encoding: "jsonParsed" }],
        }),
      }),
      fetch(HELIUS_RPC, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 2, method: "getTokenAccountsByOwner",
          params: [wallet, { programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" }, { encoding: "jsonParsed" }],
        }),
      }),
    ]);

    if (!splRes.ok && !t22Res.ok) {
      return NextResponse.json({ error: "RPC request failed" }, { status: 502 });
    }

    const splData = splRes.ok ? await splRes.json() : { result: { value: [] } };
    const t22Data = t22Res.ok ? await t22Res.json() : { result: { value: [] } };
    const accounts = [...(splData.result?.value ?? []), ...(t22Data.result?.value ?? [])];

    // Build jlMint lookup
    const jlLookup = new Map<string, { symbol: string; jlSymbol: string; assetMint: string; decimals: number }>();
    for (const token of Object.values(JL_TOKENS)) {
      jlLookup.set(token.jlMint, token);
    }

    // Fetch jlToken prices from Jupiter Price API for accurate USD values
    const jlMintList = [...jlLookup.keys()].join(",");
    let jlPrices: Record<string, number> = {};
    try {
      const priceRes = await fetch(`https://api.jup.ag/price/v3?ids=${jlMintList}`, {
        headers: { "Content-Type": "application/json" },
      });
      if (priceRes.ok) {
        const priceData = await priceRes.json();
        for (const [mint, info] of Object.entries(priceData)) {
          if (info && typeof info === "object" && "usdPrice" in info) {
            jlPrices[mint] = (info as { usdPrice: number }).usdPrice;
          }
        }
      }
    } catch { /* silent */ }

    // Also fetch vault APYs from Jupiter Lend
    let vaultApys: Record<string, number> = {};
    try {
      const lendRes = await fetch("https://api.jup.ag/lend/v1/earn/tokens", {
        headers: { "Content-Type": "application/json" },
      });
      if (lendRes.ok) {
        const vaults = await lendRes.json();
        if (Array.isArray(vaults)) {
          for (const v of vaults) {
            if (v.assetAddress) {
              vaultApys[v.assetAddress] = parseFloat(v.totalRate ?? "0") / 100;
            }
          }
        }
      }
    } catch { /* silent */ }

    // Find jlToken positions
    const positions = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const account of accounts) {
      const parsed = account.account?.data?.parsed?.info;
      if (!parsed) continue;

      const mint = parsed.mint;
      const jlInfo = jlLookup.get(mint);
      if (!jlInfo) continue;

      const amount = parsed.tokenAmount?.uiAmount ?? 0;
      if (amount <= 0) continue;

      const rawAmount = parsed.tokenAmount?.amount ?? "0";
      const apy = vaultApys[jlInfo.assetMint] ?? 0;

      // Calculate real underlying amount: jlToken amount × (jlToken price / underlying price)
      const jlPrice = jlPrices[mint] ?? 1;
      const estimatedUsd = amount * jlPrice;
      // Underlying amount = USD value / 1 (stablecoins) or use price
      // For stablecoins: underlying amount ≈ USD value
      const underlyingAmount = estimatedUsd;

      positions.push({
        mint,
        jlSymbol: jlInfo.jlSymbol,
        symbol: jlInfo.symbol,
        assetMint: jlInfo.assetMint,
        amount: rawAmount,
        uiAmount: amount,
        underlyingAmount,
        estimatedUsd,
        apy,
      });
    }

    return NextResponse.json(positions);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
