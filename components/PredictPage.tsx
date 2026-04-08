"use client";

import { useEffect, useState } from "react";

interface Market {
  id: string;
  title: string;
  yesPrice: number;
  noPrice: number;
  volume: number;
  endDate: string;
  category: string;
}

export default function PredictPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [capital, setCapital] = useState("100");
  const [side, setSide] = useState<"yes" | "no">("yes");

  useEffect(() => {
    // Fetch markets via server-side proxy
    fetch("/api/predict")
      .then((r) => r.json())
      .then((data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const items = (data.data ?? data.events ?? data ?? []) as any[];
        const parsed: Market[] = items.slice(0, 12).map((m) => ({
          id: m.id ?? m.eventId ?? crypto.randomUUID(),
          title: m.title ?? m.name ?? m.question ?? "Market",
          yesPrice: m.yesPrice ?? m.markets?.[0]?.yesPrice ?? 0.5,
          noPrice: m.noPrice ?? m.markets?.[0]?.noPrice ?? 0.5,
          volume: m.volume ?? m.totalVolume ?? 0,
          endDate: m.endDate ?? m.expiryDate ?? "",
          category: m.category ?? "Crypto",
        }));
        setMarkets(parsed);
      })
      .catch(() => {
        setMarkets([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const capitalNum = parseFloat(capital) || 0;
  const price = selectedMarket ? (side === "yes" ? selectedMarket.yesPrice : selectedMarket.noPrice) : 0;
  const shares = price > 0 ? capitalNum / price : 0;
  const payout = shares; // $1 per share if correct
  const profit = payout - capitalNum;

  return (
    <div className="animate-fadeIn space-y-4">
      {/* Header */}
      <div className="glass-card p-3 md:p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-yellow/10 border border-yellow/20 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-yellow">
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 6.5C6 5.67 6.9 5 8 5s2 .67 2 1.5S9.1 8 8 8v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.5" fill="currentColor" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-semibold text-text-primary">Predict & Earn</h2>
            <p className="text-xs text-text-dim">Bet on outcomes via Jupiter Prediction Markets. Undeployed capital earns yield in Lend.</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
            <p className="text-xs text-text-dim uppercase tracking-wider">Powered by</p>
            <p className="text-sm font-semibold text-text-primary mt-1">Jupiter Prediction</p>
          </div>
          <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
            <p className="text-xs text-text-dim uppercase tracking-wider">Idle yield</p>
            <p className="text-sm font-semibold text-mint mt-1">Variable APY</p>
          </div>
          <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
            <p className="text-xs text-text-dim uppercase tracking-wider">Currency</p>
            <p className="text-sm font-semibold text-text-primary mt-1">JupUSD</p>
          </div>
        </div>
      </div>

      {/* Markets grid + detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={selectedMarket ? "lg:col-span-8" : "lg:col-span-12"}>
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-text-primary mb-3 uppercase tracking-wider">Active Markets</h3>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-mint/30 border-t-mint rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 stagger-children">
                {markets.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMarket(m)}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedMarket?.id === m.id
                        ? "border-mint/40 bg-mint/5"
                        : "border-border bg-bg-inset hover:border-mint/20"
                    }`}
                  >
                    <p className="text-sm font-medium text-text-primary leading-tight mb-2">{m.title}</p>
                    <div className="flex items-center gap-3">
                      {/* Yes bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-green font-semibold">YES</span>
                          <span className="text-green font-mono">{(m.yesPrice * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-green rounded-full" style={{ width: `${m.yesPrice * 100}%` }} />
                        </div>
                      </div>
                      {/* No bar */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="text-red font-semibold">NO</span>
                          <span className="text-red font-mono">{(m.noPrice * 100).toFixed(0)}%</span>
                        </div>
                        <div className="h-1.5 bg-border rounded-full overflow-hidden">
                          <div className="h-full bg-red rounded-full" style={{ width: `${m.noPrice * 100}%` }} />
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-text-dim">
                      <span className="px-1.5 py-0.5 rounded bg-bg-card border border-border-subtle">{m.category}</span>
                      <span className="font-mono">${(m.volume / 1000).toFixed(0)}K vol</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order panel */}
        {selectedMarket && (
          <div className="lg:col-span-4">
            <div className="glass-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">Place Bet</h3>
                <button onClick={() => setSelectedMarket(null)} className="text-xs text-text-dim hover:text-text-primary">✕</button>
              </div>

              <p className="text-sm text-text-secondary leading-tight">{selectedMarket.title}</p>

              {/* Side toggle */}
              <div className="flex gap-1 bg-bg-inset rounded-lg p-0.5">
                <button onClick={() => setSide("yes")}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    side === "yes" ? "bg-green text-bg-base" : "text-text-muted"
                  }`}>
                  YES {(selectedMarket.yesPrice * 100).toFixed(0)}%
                </button>
                <button onClick={() => setSide("no")}
                  className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                    side === "no" ? "bg-red text-white" : "text-text-muted"
                  }`}>
                  NO {(selectedMarket.noPrice * 100).toFixed(0)}%
                </button>
              </div>

              {/* Amount */}
              <div className="bg-bg-inset rounded-lg p-3 border border-border">
                <span className="text-sm text-text-muted block mb-1">Amount</span>
                <div className="flex items-center gap-2">
                  <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                    className="input-inline flex-1 min-w-0 text-base font-mono font-semibold text-text-primary" />
                  <span className="text-sm text-text-muted">USDC</span>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-dim">Price per share</span>
                  <span className="text-text-primary font-mono">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Shares</span>
                  <span className="text-text-primary font-mono">{shares.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Payout if correct</span>
                  <span className="text-green font-mono font-semibold">${payout.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Profit if correct</span>
                  <span className="text-green font-mono font-semibold">+${profit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Idle capital yield</span>
                  <span className="text-mint font-mono">Earning in Lend</span>
                </div>
              </div>

              <button
                disabled
                className="w-full py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wide
                  bg-bg-inset border border-border text-text-dim cursor-not-allowed"
              >
                Coming Soon — Predict & Earn
              </button>
              <p className="text-xs text-text-dim text-center">Prediction markets with yield on idle capital — launching soon</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
