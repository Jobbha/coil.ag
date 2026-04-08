import { NextRequest, NextResponse } from "next/server";
import { getPrice } from "@/lib/jupiter";

// Simple in-memory cache: key → { data, expiry }
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 30_000; // 30 seconds

export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  // Normalize cache key (sort mints for consistent hits)
  const mints = ids.split(",").sort();
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
    cache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
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
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
