"use client";

import { useEffect, useState } from "react";

interface VaultOption {
  symbol: string;
  uiSymbol: string;
  assetAddress: string;
  logoUrl: string;
  totalRate: string;
}

interface Props {
  selected: string;
  onSelect: (assetAddress: string) => void;
}

export default function YieldPicker({ selected, onSelect }: Props) {
  const [vaults, setVaults] = useState<VaultOption[]>([]);

  useEffect(() => {
    fetch("/api/lend?action=tokens")
      .then((r) => r.json())
      .then((data) => {
        if (!Array.isArray(data)) return;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const opts: VaultOption[] = data.map((v: any) => ({
          symbol: v.symbol,
          uiSymbol: v.asset?.uiSymbol ?? v.symbol,
          assetAddress: v.assetAddress,
          logoUrl: v.asset?.logoUrl ?? "",
          totalRate: v.totalRate ?? "0",
        }));
        setVaults(opts);
        if (!selected && opts.length > 0) {
          const usdc = opts.find((v) => v.uiSymbol === "USDC");
          onSelect(usdc?.assetAddress ?? opts[0].assetAddress);
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (vaults.length === 0) return null;

  return (
    <div>
      <span className="text-sm text-text-muted block mb-1.5">Earn yield in</span>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {vaults.map((v) => {
          const apy = parseFloat(v.totalRate) / 100;
          const isSelected = v.assetAddress === selected;
          return (
            <button
              key={v.assetAddress}
              type="button"
              onClick={() => onSelect(v.assetAddress)}
              className={`shrink-0 w-28 flex flex-col items-center gap-1 px-2.5 py-2 rounded-lg border transition-all ${
                isSelected
                  ? "border-mint/40 bg-mint/5"
                  : "border-border bg-bg-inset hover:border-mint/20"
              }`}
            >
              {v.logoUrl && (
                <div className="w-6 h-6 rounded-full overflow-hidden bg-bg-card border border-border shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.logoUrl} alt={v.uiSymbol} className="w-full h-full object-cover" />
                </div>
              )}
              <span className={`text-sm font-semibold ${isSelected ? "text-mint" : "text-text-primary"}`}>
                {v.uiSymbol}
              </span>
              <span className={`text-xs font-mono font-bold ${isSelected ? "text-mint" : "text-text-secondary"}`}>
                {apy.toFixed(2)}%
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
