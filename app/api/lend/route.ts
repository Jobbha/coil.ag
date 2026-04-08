import { NextRequest, NextResponse } from "next/server";
import {
  lendTokens,
  lendPositions,
  lendDeposit,
  lendWithdraw,
} from "@/lib/jupiter";
import { isValidAddress, sanitizeError } from "@/lib/validation";

// Cache lend tokens (changes rarely)
let tokensCache: { data: unknown; expiry: number } | null = null;
const TOKENS_TTL = 60_000; // 60s

/** GET /api/lend?action=tokens | action=positions&wallet=... */
export async function GET(req: NextRequest) {
  const action = req.nextUrl.searchParams.get("action");

  try {
    if (action === "tokens") {
      if (tokensCache && Date.now() < tokensCache.expiry) {
        return NextResponse.json(tokensCache.data);
      }
      const tokens = await lendTokens();
      tokensCache = { data: tokens, expiry: Date.now() + TOKENS_TTL };
      return NextResponse.json(tokens);
    }
    if (action === "positions") {
      const wallet = req.nextUrl.searchParams.get("wallet");
      if (!wallet) {
        return NextResponse.json({ error: "wallet required" }, { status: 400 });
      }
      if (!isValidAddress(wallet)) {
        return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
      }
      const positions = await lendPositions(wallet);
      return NextResponse.json(positions);
    }
    return NextResponse.json(
      { error: "action must be 'tokens' or 'positions'" },
      { status: 400 },
    );
  } catch (e) {
    if (action === "tokens" && tokensCache) {
      return NextResponse.json(tokensCache.data);
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}

/** POST /api/lend — { action: "deposit"|"withdraw", asset, amount, signer } */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, asset, amount, signer } = body;

    if (!asset || !amount || !signer) {
      return NextResponse.json(
        { error: "asset, amount, and signer required" },
        { status: 400 },
      );
    }

    if (!isValidAddress(signer)) {
      return NextResponse.json({ error: "Invalid signer address" }, { status: 400 });
    }
    if (!isValidAddress(asset)) {
      return NextResponse.json({ error: "Invalid asset address" }, { status: 400 });
    }
    if (typeof amount !== "string" || !/^\d+$/.test(amount) || amount === "0") {
      return NextResponse.json({ error: "amount must be a positive integer string" }, { status: 400 });
    }

    if (action === "deposit") {
      const tx = await lendDeposit(asset, amount, signer);
      return NextResponse.json(tx);
    }
    if (action === "withdraw") {
      const tx = await lendWithdraw(asset, amount, signer);
      return NextResponse.json(tx);
    }

    return NextResponse.json(
      { error: "action must be 'deposit' or 'withdraw'" },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
