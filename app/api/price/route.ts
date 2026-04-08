import { NextRequest, NextResponse } from "next/server";
import { getPrice } from "@/lib/jupiter";
import { isValidAddress, sanitizeError, setWithLimit } from "@/lib/validation";

// Simple in-memory cache: key -> { data, expiry }
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 30_000; // 30 seconds
const MAX_CACHE_SIZE = 500;

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  // Validate each mint address
  const mints = ids.split(",").sort();
  for (const mint of mints) {
    if (!isValidAddress(mint)) {
      return NextResponse.json({ error: `Invalid mint address: ${mint.substring(0, 20)}` }, { status: 400 });
    }
  }

  // Normalize cache key (sort mints for consistent hits)
  const cacheKey = mints.join(",");

  // Check cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  }

  try {
    const data = await getPrice(mints);
    setWithLimit(cache, cacheKey, { data, expiry: Date.now() + CACHE_TTL }, MAX_CACHE_SIZE);
    return NextResponse.json(data, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
    });
  } catch (e) {
    // Serve stale cache on error
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: { "Cache-Control": "public, s-maxage=10" },
      });
    }
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
