import { NextRequest, NextResponse } from "next/server";

const BASE = "https://api.jup.ag";

function headers(): HeadersInit {
  const h: HeadersInit = { "Content-Type": "application/json" };
  const key = process.env.JUPITER_API_KEY;
  if (key) h["x-api-key"] = key;
  return h;
}

/**
 * GET /api/swap-quote?inputMint=...&outputMint=...&amount=...
 *
 * Returns a swap quote from Jupiter Swap V2.
 * Supports jlToken → any token routing (Jupiter handles redemption internally).
 */
export async function GET(req: NextRequest) {
  const inputMint = req.nextUrl.searchParams.get("inputMint");
  const outputMint = req.nextUrl.searchParams.get("outputMint");
  const amount = req.nextUrl.searchParams.get("amount");
  const slippageBps = req.nextUrl.searchParams.get("slippageBps") ?? "50";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "inputMint, outputMint, and amount required" },
      { status: 400 },
    );
  }

  try {
    const qs = new URLSearchParams({ inputMint, outputMint, amount, slippageBps });
    const res = await fetch(`${BASE}/swap/v2/order?${qs}`, { headers: headers() });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Jupiter Swap ${res.status}: ${body}` },
        { status: res.status },
      );
    }

    const data = await res.json();
    // Return the quote info (don't expose the full transaction to frontend)
    return NextResponse.json({
      inputMint,
      outputMint,
      inputAmount: amount,
      outputAmount: data.outputAmount,
      priceImpactPct: data.priceImpactPct,
      // Route info
      routeDescription: data.routePlan?.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (r: any) => r.swapInfo?.label ?? "Unknown"
      ).join(" → ") ?? "Direct",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
