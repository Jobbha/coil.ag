import { NextRequest, NextResponse } from "next/server";
import { searchTokens, getToken } from "@/lib/jupiter";
import { isValidAddress, sanitizeError } from "@/lib/validation";

const QUERY_RE = /^[a-zA-Z0-9 ]+$/;

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query");
  const mint = req.nextUrl.searchParams.get("mint");

  try {
    if (mint) {
      if (!isValidAddress(mint)) {
        return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
      }
      const token = await getToken(mint);
      return NextResponse.json(token);
    }
    if (query) {
      if (query.length > 100 || !QUERY_RE.test(query)) {
        return NextResponse.json(
          { error: "query must be max 100 chars, alphanumeric + spaces only" },
          { status: 400 },
        );
      }
      const results = await searchTokens(query);
      return NextResponse.json(results);
    }
    return NextResponse.json(
      { error: "query or mint parameter required" },
      { status: 400 },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
