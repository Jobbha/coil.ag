"use client";

import { useEffect, useState } from "react";

interface VaultData {
  id: number;
  address: string;
  symbol: string;
  name: string;
  assetAddress: string;
  asset: {
    symbol: string;
    uiSymbol: string;
    name: string;
    logoUrl: string;
    price: string;
  };
  totalRate: string;
  supplyRate: string;
  rewardsRate: string;
  totalAssets: string;
  decimals: number;
}

function getApy(vault: VaultData): number {
  return parseFloat(vault.totalRate) / 100;
}

function getTvl(vault: VaultData): number {
  const assets = parseFloat(vault.totalAssets) / Math.pow(10, vault.decimals);
  const price = parseFloat(vault.asset.price);
  return assets * price;
}

export default function YieldVaults() {
  const [vaults, setVaults] = useState<VaultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"apy" | "name" | "tvl">("apy");

  useEffect(() => {
    fetch("/api/lend?action=tokens")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setVaults(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const sorted = [...vaults].sort((a, b) => {
    if (sortBy === "apy") return getApy(b) - getApy(a);
    if (sortBy === "tvl") return getTvl(b) - getTvl(a);
    return a.asset.uiSymbol.localeCompare(b.asset.uiSymbol);
  });

  const topApy = sorted.length > 0 ? getApy(sorted[0]) : 0;
  const avgApy = sorted.length > 0 ? sorted.reduce((s, v) => s + getApy(v), 0) / sorted.length : 0;
  const totalTvl = sorted.reduce((s, v) => s + getTvl(v), 0);

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-mint">
              <path d="M8 1v14M4 5l4-4 4 4M4 11l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Jupiter Lend Vaults</h2>
          </div>
          <div className="flex items-center gap-1 bg-bg-inset rounded-lg p-0.5">
            {(["apy", "tvl", "name"] as const).map((key) => (
              <button
                key={key}
                onClick={() => setSortBy(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  sortBy === key ? "bg-mint text-bg-base" : "text-text-muted hover:text-text-primary"
                }`}
              >
                {key === "apy" ? "APY ↓" : key === "tvl" ? "TVL ↓" : "A–Z"}
              </button>
            ))}
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">Vaults</p>
            <p className="text-base font-mono font-bold text-text-primary">{sorted.length}</p>
          </div>
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">Best APY</p>
            <p className="text-base font-mono font-bold text-mint">{topApy.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">Avg APY</p>
            <p className="text-base font-mono font-bold text-text-secondary">{avgApy.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-text-dim uppercase tracking-wider">Total TVL</p>
            <p className="text-base font-mono font-bold text-text-secondary">${formatCompact(totalTvl)}</p>
          </div>
        </div>
      </div>

      {/* Vault list */}
      <div className="max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-mint/30 border-t-mint rounded-full animate-spin" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-8 text-center text-sm text-text-dim">
            No vaults available
          </div>
        ) : (
          <div className="p-2 space-y-1 stagger-children">
            {sorted.map((vault, i) => (
              <VaultRow key={vault.address} vault={vault} rank={i + 1} topApy={topApy} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VaultRow({ vault, rank, topApy }: { vault: VaultData; rank: number; topApy: number }) {
  const apy = getApy(vault);
  const tvl = getTvl(vault);
  const supplyApy = parseFloat(vault.supplyRate) / 100;
  const rewardsApy = parseFloat(vault.rewardsRate) / 100;
  const barWidth = topApy > 0 ? (apy / topApy) * 100 : 0;
  const isTop = rank <= 3;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-inset border border-border-subtle hover:border-mint/20 transition-colors group">
      {/* Rank */}
      <span className={`w-5 text-center text-xs font-mono font-bold ${isTop ? "text-mint" : "text-text-dim"}`}>
        {rank}
      </span>

      {/* Token icon */}
      <div className="w-7 h-7 rounded-full overflow-hidden bg-bg-card border border-border shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={vault.asset.logoUrl} alt={vault.asset.uiSymbol} className="w-full h-full object-cover" />
      </div>

      {/* Token info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-text-primary">{vault.asset.uiSymbol}</span>
            <span className="text-xs text-text-dim truncate">{vault.asset.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-dim font-mono">${formatCompact(tvl)}</span>
            <span className={`text-sm font-mono font-bold ${isTop ? "text-mint" : "text-text-secondary"}`}>
              {apy.toFixed(2)}%
            </span>
          </div>
        </div>

        {/* APY breakdown + bar */}
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${isTop ? "bg-mint" : "bg-mint/30"}`}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <span className="text-xs text-text-dim font-mono shrink-0">
            {supplyApy.toFixed(1)}% + {rewardsApy.toFixed(1)}%r
          </span>
        </div>
      </div>
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}
