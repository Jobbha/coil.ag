import { NextRequest, NextResponse } from "next/server";
import { searchTokens, getToken } from "@/lib/jupiter";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  const mint = req.nextUrl.searchParams.get("mint");

  try {
    if (mint) {
      const token = await getToken(mint);
      return NextResponse.json(token);
    }
    if (query) {
      const results = await searchTokens(query);
      return NextResponse.json(results);
    }
    return NextResponse.json(
      { error: "query or mint parameter required" },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
