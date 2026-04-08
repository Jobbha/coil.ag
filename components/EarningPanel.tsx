"use client";

import type { CoilOrder, CoilState } from "@/lib/coilEngine";

interface Props {
  orders: CoilOrder[];
}

const STATE_LABEL: Record<CoilState, { text: string; color: string; icon: string }> = {
  IDLE: { text: "Idle", color: "text-text-dim", icon: "○" },
  LENDING: { text: "Earning", color: "text-green", icon: "◉" },
  APPROACHING: { text: "Approaching", color: "text-yellow", icon: "◎" },
  WITHDRAWING: { text: "Withdrawing", color: "text-yellow", icon: "◎" },
  PLACED: { text: "Order Live", color: "text-mint", icon: "◈" },
  FILLED: { text: "Filled", color: "text-green", icon: "✓" },
  EXPIRED: { text: "Expired", color: "text-text-dim", icon: "✕" },
  ERROR: { text: "Error", color: "text-red", icon: "!" },
};

export default function EarningPanel({ orders }: Props) {
  const active = orders.filter((o) =>
    ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
  );
  const past = orders.filter((o) =>
    ["FILLED", "EXPIRED", "ERROR"].includes(o.state),
  );
  const totalYield = orders.reduce((sum, o) => sum + o.yieldEarned, 0);

  return (
    <div className="glass-card flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-border-subtle">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-sm font-semibold text-text-primary uppercase tracking-wider">
              Earning Orders
            </span>
          </div>
          <span className="text-sm text-text-dim">{active.length} active</span>
        </div>

        {/* Total yield summary */}
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-mono font-bold text-mint">
            +${totalYield.toFixed(4)}
          </span>
          <span className="text-sm text-text-dim">total yield earned</span>
        </div>
      </div>

      {/* Active orders */}
      <div className="flex-1 overflow-y-auto">
        {active.length === 0 && past.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-bg-inset border border-border flex items-center justify-center mb-3">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-text-dim">
                <circle cx="9" cy="9" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 5v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm text-text-muted">No active orders</p>
            <p className="text-sm text-text-dim mt-1">
              Pick a token and set your entry price to start earning
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1.5">
            {active.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {past.length > 0 && (
              <>
                <div className="px-2 pt-2 pb-1">
                  <span className="text-sm text-text-dim uppercase tracking-widest">Completed</span>
                </div>
                {past.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Footer stats */}
      {orders.length > 0 && (
        <div className="px-4 py-3 border-t border-border-subtle bg-bg-inset/50">
          <div className="grid grid-cols-3 gap-2 text-center">
            <MiniStat label="Active" value={String(active.length)} color="text-green" />
            <MiniStat label="Filled" value={String(past.filter((o) => o.state === "FILLED").length)} color="text-mint" />
            <MiniStat label="Yield" value={`$${totalYield.toFixed(2)}`} color="text-mint" />
          </div>
        </div>
      )}
    </div>
  );
}

function OrderRow({ order }: { order: CoilOrder }) {
  const cfg = STATE_LABEL[order.state];
  const capitalUsd = parseInt(order.capitalAmount) / 1e6;

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-bg-inset border border-border-subtle hover:border-border transition-colors">
      {/* State indicator */}
      <div className={`text-sm ${cfg.color}`}>{cfg.icon}</div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-text-primary font-mono">
            {order.outputMint.slice(0, 4)}...{order.outputMint.slice(-4)}
          </span>
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.text}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-sm text-text-dim">
            ${capitalUsd.toFixed(0)} → ${order.targetPrice.toFixed(2)}
          </span>
          <span className="text-base font-mono text-mint">
            +${order.yieldEarned.toFixed(4)}
          </span>
        </div>

        {/* Progress bar showing distance to target */}
        {order.distancePct !== null && order.state !== "FILLED" && (
          <div className="mt-1.5">
            <div className="h-1 bg-border rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  Math.abs(order.distancePct) <= order.proximityThreshold
                    ? "bg-yellow"
                    : "bg-mint/40"
                }`}
                style={{
                  width: `${Math.max(5, Math.min(100, (1 - Math.abs(order.distancePct)) * 100))}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-sm text-text-dim">
                {order.spotPrice !== null ? `$${order.spotPrice.toFixed(2)}` : "..."}
              </span>
              <span className="text-sm text-text-dim">
                {(order.distancePct * 100).toFixed(1)}% away
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-sm text-text-dim uppercase tracking-wider">{label}</p>
      <p className={`text-base font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}
