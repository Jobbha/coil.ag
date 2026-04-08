import { NextRequest, NextResponse } from "next/server";

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL;
const FALLBACK_RPC = "https://api.mainnet-beta.solana.com";

/**
 * POST /api/rpc — Server-side Solana RPC proxy.
 * Hides the Helius API key from the client bundle.
 */
export async function POST(req: NextRequest) {
  const rpcUrl = HELIUS_RPC_URL || FALLBACK_RPC;

  try {
    const body = await req.text();

    const res = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const data = await res.text();
    return new NextResponse(data, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { jsonrpc: "2.0", error: { code: -32603, message: "RPC proxy error" } },
      { status: 502 },
    );
  }
}
