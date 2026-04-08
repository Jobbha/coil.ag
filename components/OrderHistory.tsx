"use client";

import type { CoilOrder, CoilState } from "@/lib/coilEngine";

interface Props {
  orders: CoilOrder[];
}

export default function OrderHistory({ orders }: Props) {
  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 pt-4 pb-3">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-mint">
          <path d="M7 1l1.5 3.5L12 6l-3.5 1.5L7 11 5.5 7.5 2 6l3.5-1.5z" fill="currentColor" />
        </svg>
        <span className="text-sm font-medium text-text-primary">Your trade history</span>
      </div>

      {orders.length === 0 ? (
        <div className="px-5 pb-5">
          <p className="text-sm text-text-dim py-6 text-center">
            No orders yet. Select a token above to create your first Coil order.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-sm text-text-dim uppercase tracking-wider border-b border-border-subtle">
                <th className="px-5 pb-2 font-medium">Token</th>
                <th className="pb-2 font-medium">Entry</th>
                <th className="pb-2 font-medium">TP / SL</th>
                <th className="pb-2 font-medium">Amount</th>
                <th className="pb-2 font-medium">Yield</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 pr-5 font-medium text-right">Age</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-border-subtle last:border-0 hover:bg-bg-card-hover transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono text-blue">
                      {o.outputMint.slice(0, 4)}...{o.outputMint.slice(-4)}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-text-primary">${o.targetPrice.toFixed(2)}</td>
                  <td className="py-3 font-mono">
                    <span className="text-green">${o.takeProfitPrice.toFixed(2)}</span>
                    <span className="text-text-dim mx-1">/</span>
                    <span className="text-red">${o.stopLossPrice.toFixed(2)}</span>
                  </td>
                  <td className="py-3 font-mono text-text-primary">
                    ${(parseInt(o.capitalAmount) / 1e6).toFixed(0)}
                  </td>
                  <td className="py-3 font-mono text-mint">+${o.yieldEarned.toFixed(4)}</td>
                  <td className="py-3">
                    <StateBadge state={o.state} />
                  </td>
                  <td className="py-3 pr-5 text-right text-text-dim">
                    {formatAge(o.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StateBadge({ state }: { state: CoilState }) {
  const styles: Record<string, string> = {
    IDLE: "bg-bg-card text-text-dim",
    LENDING: "bg-green/10 text-green",
    APPROACHING: "bg-yellow/10 text-yellow",
    WITHDRAWING: "bg-yellow/10 text-yellow",
    PLACED: "bg-mint/10 text-mint",
    FILLED: "bg-green/10 text-green",
    EXPIRED: "bg-bg-card text-text-dim",
    ERROR: "bg-red/10 text-red",
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-sm font-semibold ${styles[state] ?? styles.IDLE}`}>
      {state}
    </span>
  );
}

function formatAge(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
