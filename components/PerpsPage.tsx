"use client";

import { useState } from "react";
import type { TokenListItem } from "@/lib/tokens";
import TokenList from "./TokenList";
import PriceChart from "./PriceChart";
import YieldPicker from "./YieldPicker";

type PriceMap = Record<string, { usdPrice: number; priceChange24h: number }>;

interface Props {
  prices: PriceMap;
  onPricesUpdate: (fn: (prev: PriceMap) => PriceMap) => void;
}

export default function PerpsPage({ prices, onPricesUpdate }: Props) {
  const [token, setToken] = useState<TokenListItem | null>(null);
  const [side, setSide] = useState<"long" | "short">("long");
  const [leverage, setLeverage] = useState("3");
  const [capital, setCapital] = useState("500");
  const [targetPrice, setTargetPrice] = useState("");
  const [yieldVault, setYieldVault] = useState("");

  const spotPrice = token?.usdPrice ?? 0;
  const leverageNum = parseFloat(leverage) || 1;
  const capitalNum = parseFloat(capital) || 0;
  const positionSize = capitalNum * leverageNum;
  const liqPrice = side === "long"
    ? spotPrice * (1 - 1 / leverageNum * 0.9)
    : spotPrice * (1 + 1 / leverageNum * 0.9);

  if (!token) {
    return (
      <div className="animate-fadeIn space-y-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-mint/10 border border-mint/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-mint">
                <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">Leveraged Coil</h2>
              <p className="text-xs text-text-dim">Open leveraged positions with yield on collateral via Jupiter Borrow + Lend</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">Powered by</p>
              <p className="text-sm font-semibold text-text-primary mt-1">Jupiter Borrow</p>
            </div>
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">Collateral earns</p>
              <p className="text-sm font-semibold text-mint mt-1">~3-5% APY</p>
            </div>
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">Max leverage</p>
              <p className="text-sm font-semibold text-text-primary mt-1">5x</p>
            </div>
          </div>
        </div>
        <TokenList onSelect={setToken} prices={prices} onPricesUpdate={onPricesUpdate} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9">
          <PriceChart
            mint={token.mint}
            symbol={token.symbol}
            spotPrice={token.usdPrice}
            priceChange24h={token.priceChange24h}
            targetPrice={parseFloat(targetPrice) || null}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="glass-card p-4 max-h-[calc(100vh-180px)] overflow-y-auto space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setToken(null)} className="w-6 h-6 rounded-md bg-bg-inset border border-border flex items-center justify-center text-text-muted hover:text-text-primary text-sm">←</button>
                <span className="text-sm font-semibold text-text-primary">${token.symbol}</span>
              </div>
              <span className="text-xs text-text-dim font-mono">${spotPrice.toFixed(2)}</span>
            </div>

            {/* Long / Short toggle */}
            <div className="flex gap-1 bg-bg-inset rounded-lg p-0.5">
              <button
                onClick={() => setSide("long")}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  side === "long" ? "bg-green text-bg-base" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Long ↑
              </button>
              <button
                onClick={() => setSide("short")}
                className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${
                  side === "short" ? "bg-red text-white" : "text-text-muted hover:text-text-primary"
                }`}
              >
                Short ↓
              </button>
            </div>

            {/* Capital */}
            <div className="bg-bg-inset rounded-lg p-3 border border-border">
              <span className="text-sm text-text-muted block mb-1">Collateral</span>
              <div className="flex items-center gap-2">
                <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                  className="input-inline flex-1 min-w-0 text-base font-mono font-semibold text-text-primary" />
                <span className="text-sm text-text-muted font-medium">USDC</span>
              </div>
            </div>

            {/* Leverage slider */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-text-muted">Leverage</span>
                <span className={`text-sm font-mono font-bold ${leverageNum >= 4 ? "text-red" : leverageNum >= 2 ? "text-yellow" : "text-mint"}`}>
                  {leverageNum.toFixed(1)}x
                </span>
              </div>
              <input type="range" min="1" max="5" step="0.5" value={leverage}
                onChange={(e) => setLeverage(e.target.value)}
                className="w-full h-1 rounded-full appearance-none cursor-pointer bg-border accent-mint
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mint" />
              <div className="flex justify-between text-xs text-text-dim mt-0.5">
                <span>1x</span><span>5x</span>
              </div>
            </div>

            {/* Entry price */}
            <div className="bg-bg-inset rounded-lg p-3 border border-border">
              <span className="text-sm text-text-muted block mb-1">{side === "long" ? "Entry (buy at)" : "Entry (sell at)"}</span>
              <input type="number" step="any" value={targetPrice} placeholder={spotPrice.toFixed(2)}
                onChange={(e) => setTargetPrice(e.target.value)}
                className="input-inline w-full text-base font-mono font-semibold text-text-primary" />
            </div>

            {/* Position summary */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-text-dim">Position size</span>
                <span className="text-text-primary font-mono">${positionSize.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Est. liq. price</span>
                <span className="text-red font-mono">${liqPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Collateral yield</span>
                <span className="text-mint font-mono">~3.8% APY</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Mechanism</span>
                <span className="text-text-secondary">Flashloan + Borrow</span>
              </div>
            </div>

            {/* Yield on collateral */}
            <YieldPicker selected={yieldVault} onSelect={setYieldVault} />

            {/* CTA */}
            <button className={`w-full py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wide
              ${side === "long" ? "bg-green text-bg-base" : "bg-red text-white"}
              shadow-[0_0_16px_rgba(73,231,178,0.1)]`}>
              Open {leverageNum.toFixed(1)}x {side === "long" ? "Long" : "Short"} — ${token.symbol}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
