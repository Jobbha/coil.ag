"use client";

import type { CoilOrder, CoilState } from "@/lib/coilEngine";

interface Props {
  order: CoilOrder;
}

const STATE_CONFIG: Record<CoilState, { label: string; color: string; bg: string; pulse: boolean }> = {
  IDLE: { label: "Idle", color: "text-text-muted", bg: "bg-bg-card", pulse: false },
  LENDING: { label: "Lending", color: "text-green", bg: "bg-green/10", pulse: true },
  APPROACHING: { label: "Approaching", color: "text-yellow", bg: "bg-yellow/10", pulse: true },
  WITHDRAWING: { label: "Withdrawing", color: "text-yellow", bg: "bg-yellow/10", pulse: true },
  PLACED: { label: "Order Placed", color: "text-mint", bg: "bg-mint/10", pulse: true },
  FILLED: { label: "Filled", color: "text-green", bg: "bg-green/10", pulse: false },
  EXPIRED: { label: "Expired", color: "text-text-muted", bg: "bg-bg-card", pulse: false },
  ERROR: { label: "Error", color: "text-red", bg: "bg-red/10", pulse: false },
};

export default function StatusCard({ order }: Props) {
  const cfg = STATE_CONFIG[order.state];
  const distanceStr =
    order.distancePct !== null
      ? `${order.distancePct > 0 ? "+" : ""}${(order.distancePct * 100).toFixed(2)}%`
      : "—";

  return (
    <div className="glass-card p-3 md:p-5">
      {/* Status header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full overflow-hidden bg-bg-inset shrink-0 flex items-center justify-center text-sm font-bold text-text-muted">
            {order.outputMint.slice(0, 2)}
          </div>
          <span className="text-sm font-medium text-text-primary">Active Position</span>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${cfg.bg}`}>
          {cfg.pulse && (
            <span className="relative flex h-1.5 w-1.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.color.replace("text-", "bg-")}`} />
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${cfg.color.replace("text-", "bg-")}`} />
            </span>
          )}
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <Metric label="Spot Price" value={order.spotPrice !== null ? `$${order.spotPrice.toFixed(4)}` : "—"} />
        <Metric
          label="Distance"
          value={distanceStr}
          color={order.distancePct !== null && Math.abs(order.distancePct) <= order.proximityThreshold ? "text-yellow" : undefined}
        />
        <Metric label="Target" value={`$${order.targetPrice.toFixed(4)}`} />
        <Metric label="Yield Earned" value={`$${order.yieldEarned.toFixed(4)}`} color="text-mint" />
      </div>

      {/* TP/SL strip */}
      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border-subtle text-sm">
        <span className="text-red font-mono">SL ${order.stopLossPrice.toFixed(2)}</span>
        <div className="flex-1 h-px bg-border relative">
          <div className="absolute left-1/2 -translate-x-1/2 -top-2 text-text-primary text-sm font-mono bg-bg-card px-1.5">
            Entry ${order.targetPrice.toFixed(2)}
          </div>
        </div>
        <span className="text-green font-mono">TP ${order.takeProfitPrice.toFixed(2)}</span>
      </div>

      {order.error && (
        <div className="mt-3 text-sm text-red bg-red/5 border border-red/10 rounded-lg px-3 py-2">
          {order.error}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <p className="text-sm text-text-dim uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-base font-mono font-semibold ${color ?? "text-text-primary"}`}>{value}</p>
    </div>
  );
}
