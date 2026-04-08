"use client";

import type { CoilOrder, CoilState } from "@/lib/coilEngine";

interface Props {
  orders: CoilOrder[];
}

export default function Portfolio({ orders }: Props) {
  if (orders.length === 0) return null;

  const active = orders.filter((o) =>
    ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
  );
  const filled = orders.filter((o) => o.state === "FILLED");

  const totalCapital = orders.reduce((s, o) => s + parseInt(o.capitalAmount) / 1e6, 0);
  const activeCapital = active.reduce((s, o) => s + parseInt(o.capitalAmount) / 1e6, 0);
  const totalYield = orders.reduce((s, o) => s + o.yieldEarned, 0);
  const activeYield = active.reduce((s, o) => s + o.yieldEarned, 0);

  // Weighted avg APY across active orders
  const weightedApy = activeCapital > 0
    ? active.reduce((s, o) => {
        const cap = parseInt(o.capitalAmount) / 1e6;
        const elapsed = (Date.now() - o.createdAt) / 1000;
        const apy = elapsed > 0 && cap > 0 ? (o.yieldEarned / cap) * (365 * 24 * 3600 / elapsed) * 100 : 0;
        return s + apy * cap;
      }, 0) / activeCapital
    : 0;

  // Group by token
  const byToken = new Map<string, { orders: CoilOrder[]; totalYield: number; capital: number }>();
  for (const o of orders) {
    const key = o.outputMint;
    const existing = byToken.get(key) ?? { orders: [], totalYield: 0, capital: 0 };
    existing.orders.push(o);
    existing.totalYield += o.yieldEarned;
    existing.capital += parseInt(o.capitalAmount) / 1e6;
    byToken.set(key, existing);
  }

  // Time-weighted yield: total yield / total hours
  const oldestOrder = Math.min(...orders.map((o) => o.createdAt));
  const totalHours = (Date.now() - oldestOrder) / 3_600_000;
  const yieldPerHour = totalHours > 0 ? totalYield / totalHours : 0;
  const projectedDaily = yieldPerHour * 24;
  const projectedMonthly = projectedDaily * 30;

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="px-3 md:px-5 pt-3 md:pt-4 pb-3 md:pb-4 border-b border-border-subtle">
        <div className="flex items-center gap-2 mb-4">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-mint">
            <rect x="1" y="6" width="4" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="6" y="3" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <rect x="11" y="1" width="4" height="14" rx="1" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wider">Portfolio</h2>
        </div>

        {/* Top-level stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <StatCard label="Total Deployed" value={`$${totalCapital.toFixed(0)}`} sub={`${active.length} active`} />
          <StatCard label="Total Yield" value={`+$${totalYield.toFixed(4)}`} sub={`$${activeYield.toFixed(4)} active`} color="text-mint" />
          <StatCard label="Effective APY" value={`${weightedApy.toFixed(2)}%`} sub="weighted avg" color="text-mint" />
          <StatCard label="Projected" value={`$${projectedDaily.toFixed(4)}/d`} sub={`$${projectedMonthly.toFixed(2)}/mo`} color="text-text-secondary" />
        </div>
      </div>

      {/* Per-token breakdown */}
      <div className="px-3 md:px-5 py-2 md:py-3">
        <p className="text-xs text-text-dim uppercase tracking-wider mb-2">By Token</p>
        <div className="space-y-2">
          {[...byToken.entries()].map(([mint, data]) => {
            const activeCount = data.orders.filter((o) =>
              ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
            ).length;
            const filledCount = data.orders.filter((o) => o.state === "FILLED").length;

            return (
              <div
                key={mint}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-inset border border-border-subtle"
              >
                {/* Token mint (abbreviated) */}
                <span className="text-sm font-mono text-blue font-medium w-24 shrink-0">
                  {mint.slice(0, 4)}...{mint.slice(-4)}
                </span>

                {/* State pills */}
                <div className="flex items-center gap-1.5 flex-1">
                  {activeCount > 0 && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-green/10 text-green">
                      <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                      {activeCount} active
                    </span>
                  )}
                  {filledCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-mint/10 text-mint">
                      {filledCount} filled
                    </span>
                  )}
                </div>

                {/* Capital */}
                <span className="text-sm font-mono text-text-secondary">${data.capital.toFixed(0)}</span>

                {/* Yield */}
                <span className="text-sm font-mono text-mint font-semibold">+${data.totalYield.toFixed(4)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* State breakdown */}
      <div className="px-3 md:px-5 py-2 md:py-3 border-t border-border-subtle">
        <p className="text-xs text-text-dim uppercase tracking-wider mb-2">State Breakdown</p>
        <div className="flex items-center gap-2 flex-wrap">
          <StatePill state="LENDING" orders={orders} />
          <StatePill state="APPROACHING" orders={orders} />
          <StatePill state="PLACED" orders={orders} />
          <StatePill state="FILLED" orders={orders} />
          <StatePill state="EXPIRED" orders={orders} />
          <StatePill state="ERROR" orders={orders} />
        </div>
      </div>

      {/* P&L Timeline */}
      {totalYield > 0 && (
        <div className="px-3 md:px-5 py-2 md:py-3 border-t border-border-subtle">
          <div className="flex items-center justify-between">
            <p className="text-xs text-text-dim uppercase tracking-wider">Earnings</p>
            <p className="text-xs text-text-dim">{totalHours.toFixed(1)}h total</p>
          </div>
          <div className="mt-2 flex items-end gap-1 h-12">
            {orders.filter((o) => o.yieldEarned > 0).map((o) => {
              const maxYield = Math.max(...orders.map((x) => x.yieldEarned), 0.001);
              const height = (o.yieldEarned / maxYield) * 100;
              const isActive = ["LENDING", "APPROACHING", "PLACED"].includes(o.state);
              return (
                <div
                  key={o.id}
                  className={`flex-1 rounded-t transition-all ${isActive ? "bg-mint" : "bg-mint/30"}`}
                  style={{ height: `${Math.max(4, height)}%` }}
                  title={`$${o.yieldEarned.toFixed(4)} — ${o.outputMint.slice(0, 6)}...`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color?: string }) {
  return (
    <div>
      <p className="text-xs text-text-dim uppercase tracking-wider">{label}</p>
      <p className={`text-lg font-mono font-bold ${color ?? "text-text-primary"}`}>{value}</p>
      <p className="text-xs text-text-dim mt-0.5">{sub}</p>
    </div>
  );
}

const STATE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  LENDING: { bg: "bg-green/10", text: "text-green", label: "Earning" },
  APPROACHING: { bg: "bg-yellow/10", text: "text-yellow", label: "Approaching" },
  PLACED: { bg: "bg-mint/10", text: "text-mint", label: "Live" },
  FILLED: { bg: "bg-green/10", text: "text-green", label: "Filled" },
  EXPIRED: { bg: "bg-bg-card", text: "text-text-dim", label: "Expired" },
  ERROR: { bg: "bg-red/10", text: "text-red", label: "Error" },
};

function StatePill({ state, orders }: { state: CoilState; orders: CoilOrder[] }) {
  const count = orders.filter((o) => o.state === state).length;
  if (count === 0) return null;
  const cfg = STATE_COLORS[state];
  if (!cfg) return null;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${cfg.bg} ${cfg.text}`}>
      {cfg.label}: {count}
    </span>
  );
}
