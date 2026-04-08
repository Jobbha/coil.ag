import { NextRequest, NextResponse } from "next/server";
import { headers as jupiterHeaders } from "@/lib/jupiter";
import { isValidAddress, sanitizeError } from "@/lib/validation";

const BASE = "https://api.jup.ag";

/**
 * GET /api/swap-quote?inputMint=...&outputMint=...&amount=...&taker=...
 *
 * Returns a swap quote from Jupiter Swap V2.
 * When `taker` is provided, also returns the assembled transaction for signing.
 * Supports jlToken -> any token routing (Jupiter handles redemption internally).
 */
export async function GET(req: NextRequest) {
  const inputMint = req.nextUrl.searchParams.get("inputMint");
  const outputMint = req.nextUrl.searchParams.get("outputMint");
  const amount = req.nextUrl.searchParams.get("amount");
  const taker = req.nextUrl.searchParams.get("taker");
  const slippageBps = req.nextUrl.searchParams.get("slippageBps") ?? "50";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint, and amount required" },
      { status: 400 },
    );
  }

  if (!isValidAddress(inputMint)) {
    return NextResponse.json({ error: "Invalid inputMint address" }, { status: 400 });
  }
  if (!isValidAddress(outputMint)) {
    return NextResponse.json({ error: "Invalid outputMint address" }, { status: 400 });
  }
  if (!/^\d+$/.test(amount) || amount === "0") {
    return NextResponse.json({ error: "amount must be a positive integer string" }, { status: 400 });
  }
  if (taker && !isValidAddress(taker)) {
    return NextResponse.json({ error: "Invalid taker address" }, { status: 400 });
  }

  try {
    const params: Record<string, string> = { inputMint, outputMint, amount, slippageBps };
    if (taker) params.taker = taker;

    const qs = new URLSearchParams(params);
    const res = await fetch(`${BASE}/swap/v2/order?${qs}`, { headers: jupiterHeaders() });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: sanitizeError(`Jupiter Swap ${res.status}: ${body}`) },
        { status: res.status },
      );
    }

    const data = await res.json();

    const result: Record<string, unknown> = {
      inputMint,
      outputMint,
      inputAmount: amount,
      outputAmount: data.outputAmount,
      priceImpactPct: data.priceImpactPct,
      routeDescription: data.routePlan?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.swapInfo?.label ?? "Unknown"
      ).join(" → ") ?? "Direct",
    };

    // Include transaction when taker is provided (needed for signing)
    if (taker && data.swapTransaction) {
      result.swapTransaction = data.swapTransaction;
      result.requestId = data.requestId;
    }

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
