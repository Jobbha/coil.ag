import { NextRequest, NextResponse } from "next/server";
import { isValidAddress, sanitizeError, setWithLimit } from "@/lib/validation";

// GeckoTerminal free API — real on-chain OHLCV with volume
const GT_BASE = "https://api.geckoterminal.com/api/v2";

// Cache: pool lookups + candle data
const poolCache = new Map<string, { pool: string; expiry: number }>();
const candleCache = new Map<string, { data: unknown; expiry: number }>();
const POOL_TTL = 300_000; // 5 min
const CANDLE_TTL = 30_000; // 30 sec
const MAX_POOL_CACHE = 50;
const MAX_CANDLE_CACHE = 200;

// Timeframe -> GeckoTerminal params
const TF_CONFIG: Record<string, { timeframe: string; aggregate: number; limit: number }> = {
  "1m":  { timeframe: "minute", aggregate: 1,  limit: 500 },
  "5m":  { timeframe: "minute", aggregate: 5,  limit: 500 },
  "15m": { timeframe: "minute", aggregate: 15, limit: 500 },
  "1h":  { timeframe: "hour",   aggregate: 1,  limit: 500 },
  "4h":  { timeframe: "hour",   aggregate: 4,  limit: 500 },
  "1d":  { timeframe: "day",    aggregate: 1,  limit: 365 },
};

const ALLOWED_TF = new Set(Object.keys(TF_CONFIG));

/** Find the highest-volume USDC pool for a given token on Solana */
async function findPool(mint: string): Promise<string | null> {
  const cached = poolCache.get(mint);
  if (cached && Date.now() < cached.expiry) return cached.pool;

  try {
    const res = await fetch(
      `${GT_BASE}/networks/solana/tokens/${mint}/pools?page=1`,
    );
    if (!res.ok) return null;
    const json = await res.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pools = (json.data ?? []) as any[];

    // Prefer pools paired with USDC or SOL stables
    const solMint = "So11111111111111111111111111111111111111112";

    // Find best USDC pool, fallback to SOL pool, fallback to highest volume
    const stablePool = pools.find((p) => {
      const name: string = p.attributes?.name ?? "";
      return name.includes("USDC") || name.includes("USD");
    });
    const solPool = pools.find((p) => {
      const tokens = p.relationships?.base_token?.data?.id ?? "";
      const quote = p.relationships?.quote_token?.data?.id ?? "";
      return tokens.includes(solMint) || quote.includes(solMint);
    });

    const pool = stablePool ?? solPool ?? pools[0];
    const addr = pool?.attributes?.address;
    if (addr) {
      setWithLimit(poolCache, mint, { pool: addr, expiry: Date.now() + POOL_TTL }, MAX_POOL_CACHE);
    }
    return addr ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get("mint");
  const tf = req.nextUrl.searchParams.get("tf") ?? "15m";

  if (!mint) {
    return NextResponse.json({ error: "mint required" }, { status: 400 });
  }
  if (!isValidAddress(mint)) {
    return NextResponse.json({ error: "Invalid mint address" }, { status: 400 });
  }
  if (!ALLOWED_TF.has(tf)) {
    return NextResponse.json(
      { error: `Invalid timeframe. Allowed: ${[...ALLOWED_TF].join(", ")}` },
      { status: 400 },
    );
  }

  const config = TF_CONFIG[tf];
  const cacheKey = `${mint}:${tf}`;

  // Check candle cache
  const cached = candleCache.get(cacheKey);
  if (cached && Date.now() < cached.expiry) {
    return NextResponse.json(cached.data);
  }

  // Find pool for token
  const poolAddr = await findPool(mint);
  if (!poolAddr) {
    return NextResponse.json({ error: "No pool found for token" }, { status: 404 });
  }

  try {
    const url = `${GT_BASE}/networks/solana/pools/${poolAddr}/ohlcv/${config.timeframe}?aggregate=${config.aggregate}&limit=${config.limit}&currency=usd`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GeckoTerminal ${res.status}`);

    const json = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rawList: any[] = json.data?.attributes?.ohlcv_list ?? [];

    // GeckoTerminal returns [timestamp, open, high, low, close, volume] newest-first
    const candles = rawList
      .reverse()
      .map(([t, o, h, l, c, v]: number[]) => ({
        time: t,
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
      }));

    setWithLimit(candleCache, cacheKey, { data: candles, expiry: Date.now() + CANDLE_TTL }, MAX_CANDLE_CACHE);
    return NextResponse.json(candles);
  } catch (e) {
    if (cached) return NextResponse.json(cached.data);
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: sanitizeError(msg) }, { status: 502 });
  }
}
