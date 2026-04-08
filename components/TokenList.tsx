"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { POPULAR_TOKENS, type TokenListItem } from "@/lib/tokens";

type PriceMap = Record<string, { usdPrice: number; priceChange24h: number }>;
type YieldMap = Record<string, number>; // assetAddress → APY %

interface Props {
  onSelect: (token: TokenListItem) => void;
  prices: PriceMap;
  onPricesUpdate: (fn: (prev: PriceMap) => PriceMap) => void;
}

export default function TokenList({ onSelect, prices, onPricesUpdate }: Props) {
  const [query, setQuery] = useState("");
  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [yieldMap, setYieldMap] = useState<YieldMap>({});

  // Fetch vault APYs once to show yield badges on matching tokens
  useEffect(() => {
    fetch("/api/lend?action=tokens")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        const m: YieldMap = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const v of data as any[]) {
          if (v.assetAddress && v.totalRate) {
            m[v.assetAddress] = parseFloat(v.totalRate) / 100;
          }
        }
        setYieldMap(m);
      })
      .catch(() => {});
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setTokens([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/tokens?query=${encodeURIComponent(q)}`);
      if (!res.ok) return;
      const data = await res.json();
      const items: TokenListItem[] = (Array.isArray(data) ? data : data.tokens ?? []).map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (t: any) => ({
          mint: t.id ?? t.mint,
          symbol: t.symbol,
          name: t.name,
          icon: t.icon,
          usdPrice: t.usdPrice,
          priceChange24h: t.stats24h?.priceChange ?? t.priceChange24h,
        }),
      );
      setTokens(items);

      const newMints = items.map((t) => t.mint).filter((m) => !prices[m]).slice(0, 50);
      if (newMints.length > 0) {
        const pRes = await fetch(`/api/price?ids=${newMints.join(",")}`);
        if (pRes.ok) {
          const pData = await pRes.json();
          onPricesUpdate((prev) => {
            const next = { ...prev };
            for (const [mint, info] of Object.entries(pData)) {
              if (info && typeof info === "object" && "usdPrice" in info) {
                const i = info as { usdPrice: number; priceChange24h: number };
                next[mint] = { usdPrice: i.usdPrice, priceChange24h: i.priceChange24h };
              }
            }
            return next;
          });
        }
      }
    } catch { /* */ }
    finally { setLoading(false); }
  }, [prices, onPricesUpdate]);

  function handleInput(val: string) {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  const displayTokens: TokenListItem[] = query.trim() ? tokens : POPULAR_TOKENS;

  return (
    <div className="glass-card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">Select a token to Coil</h2>
        <span className="text-sm text-text-dim">Earn yield while waiting for your price</span>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder='Search tokens... try "SOL" or "JUP"'
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-mint/30 border-t-mint rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Label */}
      <p className="text-sm text-text-dim uppercase tracking-wider px-1">
        {query.trim() ? `${displayTokens.length} results` : "Popular tokens"}
      </p>

      {/* Token grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 stagger-children">
        {displayTokens.map((token) => {
          const p = prices[token.mint] ?? (token.usdPrice ? { usdPrice: token.usdPrice, priceChange24h: token.priceChange24h ?? 0 } : null);
          return (
            <button
              key={token.mint}
              onClick={() => onSelect({ ...token, usdPrice: p?.usdPrice, priceChange24h: p?.priceChange24h })}
              className="flex items-center gap-3 p-3.5 rounded-xl bg-bg-inset border border-border
                         hover:border-mint/30 hover:bg-bg-card-hover transition-all text-left group"
            >
              <TokenIcon icon={token.icon} symbol={token.symbol} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-text-primary">${token.symbol}</span>
                  <span className="text-sm text-text-dim truncate">{token.name}</span>
                  {yieldMap[token.mint] != null && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint/10 border border-mint/20 text-sm font-mono font-semibold text-mint shrink-0">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-mint">
                        <path d="M5 1v8M3 3l2-2 2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {yieldMap[token.mint].toFixed(1)}% APY
                    </span>
                  )}
                </div>
                {p ? (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-base font-mono text-text-secondary">
                      ${formatPrice(p.usdPrice)}
                    </span>
                    <span className={`text-base font-mono ${p.priceChange24h >= 0 ? "text-green" : "text-red"}`}>
                      {p.priceChange24h >= 0 ? "+" : ""}{p.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-text-dim mt-0.5 block">Loading...</span>
                )}
              </div>
              <span className="text-text-dim group-hover:text-mint transition-colors">→</span>
            </button>
          );
        })}
      </div>

      {query.trim() && displayTokens.length === 0 && !loading && (
        <p className="text-sm text-text-dim text-center py-6">No tokens found</p>
      )}
    </div>
  );
}

function TokenIcon({ icon, symbol }: { icon?: string; symbol: string }) {
  const [failed, setFailed] = useState(false);

  if (icon && !failed) {
    return (
      <div className="w-10 h-10 rounded-full overflow-hidden bg-bg-card border border-border shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={icon} alt={symbol} className="w-full h-full object-cover" onError={() => setFailed(true)} />
      </div>
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-bg-card border border-border flex items-center justify-center text-sm font-bold text-text-muted shrink-0">
      {symbol.slice(0, 2)}
    </div>
  );
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  if (price >= 0.0001) return price.toFixed(6);
  return price.toExponential(2);
}
