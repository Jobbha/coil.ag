"use client";

import { useState } from "react";

export default function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
  const [calcAmount, setCalcAmount] = useState("10000");
  const [calcDays, setCalcDays] = useState("14");
  const amt = parseFloat(calcAmount) || 0;
  const days = parseFloat(calcDays) || 0;
  const yield5 = (amt * 0.05 * days) / 365;
  const yield8 = (amt * 0.08 * days) / 365;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-shell to-bg-card p-5 md:p-8">
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-2xl mx-auto text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20">
          <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
          <span className="text-sm font-medium text-mint">Powered by Jupiter</span>
        </div>

        <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-text-primary leading-tight">
          Set a limit order.{" "}
          <span className="text-mint">Earn while you wait.</span>
        </h1>

        <p className="text-sm md:text-base text-text-secondary leading-relaxed max-w-lg mx-auto">
          Your capital earns yield in Jupiter Lend until your target price hits.
          Then Coil auto-executes your order.
        </p>

        <div className="flex items-center justify-center gap-6 pt-2 text-center">
          <div>
            <p className="text-lg md:text-xl font-bold font-mono text-mint">Variable</p>
            <p className="text-xs text-text-dim">APY while waiting</p>
          </div>
          <div className="w-px h-8 bg-border-subtle" />
          <div>
            <p className="text-lg md:text-xl font-bold font-mono text-text-primary">OTOCO</p>
            <p className="text-xs text-text-dim">Entry + TP + SL</p>
          </div>
          <div className="w-px h-8 bg-border-subtle" />
          <div>
            <p className="text-lg md:text-xl font-bold font-mono text-text-primary">24/7</p>
            <p className="text-xs text-text-dim">Auto-execution</p>
          </div>
        </div>

        {/* Yield calculator */}
        <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
          <span className="text-text-secondary">If I place a</span>
          <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg px-3 py-1.5">
            <span className="text-text-muted">$</span>
            <input
              type="number"
              value={calcAmount}
              onChange={(e) => setCalcAmount(e.target.value)}
              className="w-24 bg-transparent text-white font-mono font-bold text-center outline-none"
            />
          </div>
          <span className="text-text-secondary">order waiting</span>
          <div className="flex items-center gap-1 bg-bg-card border border-border rounded-lg px-3 py-1.5">
            <input
              type="number"
              value={calcDays}
              onChange={(e) => setCalcDays(e.target.value)}
              className="w-12 bg-transparent text-white font-mono font-bold text-center outline-none"
            />
            <span className="text-text-muted">days</span>
          </div>
        </div>
        {amt > 0 && days > 0 && (
          <p className="text-xl font-bold font-mono text-mint">
            I earn ${yield5.toFixed(2)} – ${yield8.toFixed(2)} for free
          </p>
        )}

        {onGetStarted && (
          <button
            onClick={onGetStarted}
            className="px-8 py-3 rounded-xl bg-mint text-bg-base font-semibold text-sm uppercase tracking-wide
                       hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)] animate-mintPulse"
          >
            Start earning
          </button>
        )}
      </div>
    </div>
  );
}
