"use client";

import { POPULAR_TOKENS, type TokenListItem } from "@/lib/tokens";

interface Props {
  onTokenClick: (token: TokenListItem) => void;
  prices: Record<string, { usdPrice: number; priceChange24h: number }>;
}

export default function TickerStrip({ onTokenClick, prices }: Props) {

  return (
    <div className="flex items-center gap-1 px-6 py-2.5 border-b border-border-subtle overflow-x-auto">
      <span className="flex items-center gap-1.5 text-sm font-medium text-mint shrink-0 mr-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 1l1.5 3.5L11 6l-3.5 1.5L6 11 4.5 7.5 1 6l3.5-1.5z" />
        </svg>
        Coil Ready
      </span>
      {POPULAR_TOKENS.slice(0, 8).map((token) => {
        const p = prices[token.mint];
        return (
          <button
            key={token.mint}
            onClick={() => onTokenClick({ ...token, usdPrice: p?.usdPrice, priceChange24h: p?.priceChange24h })}
            className="flex items-center gap-2 px-3 py-1 rounded-lg hover:bg-bg-card-hover transition-colors shrink-0 group"
          >
            <div className="w-5 h-5 rounded-full overflow-hidden bg-bg-card shrink-0">
              {token.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-text-muted">
                  {token.symbol.slice(0, 2)}
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-text-primary group-hover:text-mint transition-colors">
              ${token.symbol}
            </span>
            {p ? (
              <>
                <span className="text-base font-mono text-text-secondary">
                  ${formatCompact(p.usdPrice)}
                </span>
                <span
                  className={`text-base font-mono ${
                    p.priceChange24h >= 0 ? "text-green" : "text-red"
                  }`}
                >
                  {p.priceChange24h >= 0 ? "+" : ""}
                  {p.priceChange24h.toFixed(1)}%
                </span>
              </>
            ) : (
              <span className="text-sm text-text-dim">...</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function formatCompact(price: number): string {
  if (price >= 1000) return price.toFixed(0);
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toExponential(1);
}
