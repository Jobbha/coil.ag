"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import type { CoilOrder, CoilState } from "@/lib/coilEngine";
import { getJlToken } from "@/lib/jlTokens";

interface Props {
  orders: CoilOrder[];
  onCancelOrder?: (orderId: string) => void;
  onUpdateOrder?: (orderId: string, updates: Partial<CoilOrder>) => void;
}

const STATE_STYLE: Record<CoilState, { label: string; color: string; bg: string }> = {
  IDLE: { label: "Idle", color: "text-text-dim", bg: "bg-bg-card" },
  LENDING: { label: "Earning Yield", color: "text-green", bg: "bg-green/10" },
  APPROACHING: { label: "Approaching", color: "text-yellow", bg: "bg-yellow/10" },
  WITHDRAWING: { label: "Withdrawing", color: "text-yellow", bg: "bg-yellow/10" },
  PLACED: { label: "Order Live", color: "text-mint", bg: "bg-mint/10" },
  FILLED: { label: "Filled", color: "text-green", bg: "bg-green/10" },
  EXPIRED: { label: "Expired", color: "text-text-dim", bg: "bg-bg-card" },
  ERROR: { label: "Error", color: "text-red", bg: "bg-red/10" },
};

interface LendPosition {
  mint: string;
  symbol?: string;
  amount: string;
  value_usd: number;
  apy: number;
}

export default function PositionsPanel({ orders, onCancelOrder, onUpdateOrder }: Props) {
  const { publicKey } = useWallet();
  const [tab, setTab] = useState<"active" | "history">("active");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lendPositions, setLendPositions] = useState<LendPosition[]>([]);

  // Fetch real on-chain Lend positions
  useEffect(() => {
    if (!publicKey) return;
    const addr = publicKey.toBase58();
    function fetchPositions() {
      fetch(`/api/lend?action=positions&wallet=${addr}`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setLendPositions(data); })
        .catch(() => {});
    }
    fetchPositions();
    const iv = setInterval(fetchPositions, 30_000);
    return () => clearInterval(iv);
  }, [publicKey]);

  const active = orders.filter((o) =>
    ["LENDING", "APPROACHING", "WITHDRAWING", "PLACED"].includes(o.state),
  );
  const history = orders.filter((o) =>
    ["FILLED", "EXPIRED", "ERROR"].includes(o.state),
  );
  const totalYield = orders.reduce((s, o) => s + o.yieldEarned, 0);
  const displayOrders = tab === "active" ? active : history;

  return (
    <div className="glass-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-3 pb-0 border-b border-border-subtle">
        <div className="flex items-center gap-4">
          <TabBtn label={`Active (${active.length})`} active={tab === "active"} onClick={() => setTab("active")} />
          <TabBtn label={`History (${history.length})`} active={tab === "history"} onClick={() => setTab("history")} />
        </div>
        {totalYield > 0 && (
          <span className="text-base font-mono text-mint mb-2">
            Total yield: +${totalYield.toFixed(4)}
          </span>
        )}
      </div>

      {/* Table */}
      {displayOrders.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-text-dim">
            {tab === "active"
              ? "No active positions. Place an order to start earning yield."
              : "No completed orders yet."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {displayOrders.map((o) => {
            const isExpanded = expandedId === o.id;
            const cfg = STATE_STYLE[o.state];
            const dist = o.distancePct !== null
              ? `${o.distancePct > 0 ? "+" : ""}${(o.distancePct * 100).toFixed(2)}%`
              : "—";

            return (
              <div key={o.id} className="border-t border-border-subtle">
                {/* Row */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  className="w-full flex items-center gap-0 px-4 py-2.5 text-left hover:bg-bg-card-hover transition-colors text-sm"
                >
                  <span className="w-[20%] md:w-[12%] font-mono text-blue truncate">
                    {o.outputMint.slice(0, 4)}…{o.outputMint.slice(-4)}
                  </span>
                  <span className="w-[25%] md:w-[14%]">
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs md:text-sm font-semibold ${cfg.bg} ${cfg.color}`}>
                      {["LENDING", "APPROACHING", "PLACED"].includes(o.state) && (
                        <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                      )}
                      {cfg.label}
                    </span>
                  </span>
                  <span className="w-[15%] md:w-[10%] font-mono text-text-primary">${o.targetPrice.toFixed(2)}</span>
                  <span className="hidden md:inline w-[10%] font-mono text-text-secondary">
                    {o.spotPrice !== null ? `$${o.spotPrice.toFixed(2)}` : "—"}
                  </span>
                  <span className={`hidden md:inline w-[8%] font-mono ${
                    o.distancePct !== null && Math.abs(o.distancePct) <= o.proximityThreshold
                      ? "text-yellow" : "text-text-secondary"
                  }`}>{dist}</span>
                  <span className="hidden md:inline w-[14%] font-mono">
                    <span className="text-green">${o.takeProfitPrice.toFixed(2)}</span>
                    <span className="text-text-dim mx-0.5">/</span>
                    <span className="text-red">${o.stopLossPrice.toFixed(2)}</span>
                  </span>
                  <span className="hidden md:inline w-[8%] font-mono text-text-primary">${(parseInt(o.capitalAmount, 10) / 1e6).toFixed(0)}</span>
                  <span className="w-[20%] md:w-[10%] font-mono text-mint">+${o.yieldEarned.toFixed(4)}</span>
                  <span className="w-[12%] md:w-[8%] text-right text-text-dim">{formatAge(o.createdAt)}</span>
                  <span className="w-[8%] md:w-[6%] text-right text-text-dim">
                    <svg
                      width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
                      className={`inline transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <path d="M1 1l4 4 4-4" />
                    </svg>
                  </span>
                </button>

                {/* Expanded detail panel */}
                <AnimatedCollapse open={isExpanded}>
                  <OrderDetail order={o} onCancel={onCancelOrder} onUpdate={onUpdateOrder} />
                </AnimatedCollapse>
              </div>
            );
          })}
        </div>
      )}

      {/* On-chain Lend positions */}
      {lendPositions.length > 0 && (
        <div className="border-t border-border-subtle">
          <div className="px-4 py-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green animate-pulse" />
            <span className="text-xs text-text-dim uppercase tracking-wider font-medium">On-Chain Lend Positions</span>
          </div>
          {lendPositions.map((pos) => (
            <div key={pos.mint} className="flex items-center gap-3 px-4 py-2.5 border-t border-border-subtle text-sm">
              <span className="w-[20%] font-mono text-blue truncate">{pos.mint.slice(0, 6)}...{pos.mint.slice(-4)}</span>
              <span className="w-[20%]">
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold bg-green/10 text-green">
                  <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                  Earning
                </span>
              </span>
              <span className="w-[20%] font-mono text-text-primary">{parseFloat(pos.amount).toFixed(4)}</span>
              <span className="w-[15%] font-mono text-text-secondary">${pos.value_usd.toFixed(2)}</span>
              <span className="w-[15%] font-mono text-mint">{pos.apy?.toFixed(2) ?? "—"}% APY</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderDetail({ order, onCancel, onUpdate }: { order: CoilOrder; onCancel?: (id: string) => void; onUpdate?: (id: string, updates: Partial<CoilOrder>) => void }) {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const [executing, setExecuting] = useState(false);
  const [execStatus, setExecStatus] = useState("");

  const capitalUsd = parseInt(order.capitalAmount, 10) / 1e6;
  const elapsed = (Date.now() - order.createdAt) / 1000;
  const elapsedHrs = elapsed / 3600;
  const yieldPerHour = elapsedHrs > 0 ? order.yieldEarned / elapsedHrs : 0;
  const projectedDaily = yieldPerHour * 24;
  const projectedMonthly = projectedDaily * 30;
  const effectiveApy = capitalUsd > 0 ? (order.yieldEarned / capitalUsd) * (365 * 24 * 3600 / elapsed) * 100 : 0;

  async function handleExecute() {
    if (!publicKey || !signTransaction || !onUpdate) return;

    setExecuting(true);
    setExecStatus("Building swap...");

    try {
      // Get jlToken mint for swap input
      const jlToken = order.yieldMint ? { jlMint: order.yieldMint } : getJlToken(order.inputMint);
      const inputMint = jlToken?.jlMint ?? order.inputMint;

      // Get swap quote + transaction: jlToken → target token
      const qs = new URLSearchParams({
        inputMint,
        outputMint: order.outputMint,
        amount: order.capitalAmount,
        taker: publicKey.toBase58(),
        slippageBps: "100",
      });
      const res = await fetch(`/api/swap-quote?${qs}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to get swap quote");
      }

      const data = await res.json();
      if (!data.swapTransaction) throw new Error("No swap transaction returned");

      // Sign the swap tx
      setExecStatus("Sign in wallet...");
      const txBytes = Buffer.from(data.swapTransaction, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);

      // Send
      setExecStatus("Sending swap...");
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // Confirm
      setExecStatus("Confirming...");
      await connection.confirmTransaction(sig, "confirmed");

      // Update order to FILLED
      onUpdate(order.id, { state: "FILLED" });
      setExecStatus("Filled!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Swap failed";
      if (msg.includes("User rejected") || msg.includes("cancelled")) {
        setExecStatus("Cancelled");
      } else {
        setExecStatus(msg.length > 60 ? msg.slice(0, 60) + "..." : msg);
      }
      setTimeout(() => setExecStatus(""), 5000);
    } finally {
      setExecuting(false);
    }
  }

  return (
    <div className="bg-bg-inset border-t border-border-subtle px-4 py-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Yield earnings chart */}
        <div className="md:col-span-4">
          <h4 className="text-sm text-text-dim uppercase tracking-wider mb-3">Yield Earnings</h4>
          <YieldMiniChart earned={order.yieldEarned} elapsed={elapsed} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MiniStat label="Earned" value={`$${order.yieldEarned.toFixed(4)}`} color="text-mint" />
            <MiniStat label="Effective APY" value={`${effectiveApy.toFixed(1)}%`} color="text-mint" />
            <MiniStat label="$/hour" value={`$${yieldPerHour.toFixed(6)}`} color="text-text-secondary" />
            <MiniStat label="Projected/day" value={`$${projectedDaily.toFixed(4)}`} color="text-text-secondary" />
          </div>
        </div>

        {/* Center: Order details */}
        <div className="md:col-span-4">
          <h4 className="text-sm text-text-dim uppercase tracking-wider mb-3">Order Details</h4>
          <div className="space-y-2">
            <DetailRow label="Capital" value={`$${capitalUsd.toFixed(2)} USDC`} />
            <DetailRow label="Entry Price" value={`$${order.targetPrice.toFixed(4)}`} />
            <DetailRow label="Take Profit" value={`$${order.takeProfitPrice.toFixed(4)}`} color="text-green" />
            <DetailRow label="Stop Loss" value={`$${order.stopLossPrice.toFixed(4)}`} color="text-red" />
            <DetailRow label="Trigger Threshold" value={`${(order.proximityThreshold * 100).toFixed(1)}%`} />
            <DetailRow label="Order Type" value="OTOCO" />
            <DetailRow label="Created" value={new Date(order.createdAt).toLocaleString()} />
          </div>
        </div>

        {/* Right: Price progress + actions */}
        <div className="md:col-span-4">
          <h4 className="text-sm text-text-dim uppercase tracking-wider mb-3">Price Progress</h4>

          {/* Visual price range */}
          <PriceRangeBar order={order} />

          <div className="space-y-2 mt-3">
            <DetailRow
              label="Spot"
              value={order.spotPrice !== null ? `$${order.spotPrice.toFixed(4)}` : "—"}
            />
            <DetailRow
              label="Distance"
              value={order.distancePct !== null ? `${(order.distancePct * 100).toFixed(2)}%` : "—"}
              color={order.distancePct !== null && Math.abs(order.distancePct) <= order.proximityThreshold ? "text-yellow" : undefined}
            />
            <DetailRow label="Projected monthly" value={`$${projectedMonthly.toFixed(2)}`} color="text-mint" />
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 mt-4">
            {order.state === "APPROACHING" && publicKey && (
              <button
                onClick={handleExecute}
                disabled={executing}
                className={`w-full py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-all ${
                  executing
                    ? "bg-bg-inset border border-border text-text-muted cursor-wait"
                    : "bg-mint text-bg-base hover:bg-mint-dark shadow-[0_0_16px_rgba(73,231,178,0.15)]"
                }`}
              >
                {executing ? execStatus : "Execute Order Now"}
              </button>
            )}
            {order.state === "LENDING" && publicKey && (
              <button
                onClick={handleExecute}
                disabled={executing}
                className={`w-full py-1.5 rounded-md text-sm font-medium transition-colors ${
                  executing
                    ? "bg-bg-inset border border-border text-text-muted cursor-wait"
                    : "border border-mint/20 text-mint bg-mint/5 hover:bg-mint/10"
                }`}
              >
                {executing ? execStatus : "Force Execute Now"}
              </button>
            )}
            <div className="flex gap-2">
              {["LENDING", "APPROACHING"].includes(order.state) && (
                <button
                  onClick={() => onCancel?.(order.id)}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium border border-red/20 text-red bg-red/5
                             hover:bg-red/10 transition-colors"
                >
                  Cancel
                </button>
              )}
              {order.state === "PLACED" && (
                <button
                  onClick={() => onCancel?.(order.id)}
                  className="flex-1 py-1.5 rounded-md text-sm font-medium border border-red/20 text-red bg-red/5
                             hover:bg-red/10 transition-colors"
                >
                  Cancel Order
                </button>
              )}
            </div>
          </div>

          {execStatus && !executing && (
            <div className={`mt-2 text-sm px-2 py-1.5 rounded-md ${
              execStatus === "Filled!" ? "text-green bg-green/5 border border-green/10" : "text-red bg-red/5 border border-red/10"
            }`}>
              {execStatus}
            </div>
          )}

          {order.error && (
            <div className="mt-2 text-sm text-red bg-red/5 border border-red/10 rounded-md px-2 py-1.5">
              {order.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function YieldMiniChart({ earned, elapsed }: { earned: number; elapsed: number }) {
  // Generate projected yield curve
  const W = 200;
  const H = 60;
  const points = Array.from({ length: 20 }, (_, i) => {
    const t = (i / 19) * elapsed;
    const y = earned * (t / elapsed);
    return { t, y };
  });

  if (earned <= 0) {
    return (
      <div className="h-[60px] flex items-center justify-center">
        <span className="text-sm text-text-dim">Accumulating...</span>
      </div>
    );
  }

  const maxY = earned * 1.1;
  const pathStr = points
    .map((p, i) => {
      const x = (i / 19) * W;
      const y = H - (p.y / maxY) * (H - 4);
      return `${i === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");
  const areaStr = `${pathStr} L${W},${H} L0,${H} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[60px]">
      <defs>
        <linearGradient id="yieldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#49E7B2" stopOpacity={0.15} />
          <stop offset="100%" stopColor="#49E7B2" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaStr} fill="url(#yieldGrad)" />
      <path d={pathStr} fill="none" stroke="#49E7B2" strokeWidth={1.5} />
      <circle cx={W} cy={H - (earned / maxY) * (H - 4)} r={2.5} fill="#49E7B2">
        <animate attributeName="r" values="2;4;2" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

function PriceRangeBar({ order }: { order: CoilOrder }) {
  const sl = order.stopLossPrice;
  const tp = order.takeProfitPrice;
  const entry = order.targetPrice;
  const spot = order.spotPrice;
  const range = tp - sl;

  if (range <= 0) return null;

  const entryPct = ((entry - sl) / range) * 100;
  const spotPct = spot !== null ? Math.max(0, Math.min(100, ((spot - sl) / range) * 100)) : null;

  return (
    <div className="relative h-6 bg-bg-card rounded-md border border-border overflow-hidden">
      {/* SL zone */}
      <div className="absolute left-0 top-0 bottom-0 bg-red/10" style={{ width: `${entryPct}%` }} />
      {/* TP zone */}
      <div className="absolute right-0 top-0 bottom-0 bg-green/10" style={{ width: `${100 - entryPct}%` }} />

      {/* Entry line */}
      <div className="absolute top-0 bottom-0 w-px bg-text-primary" style={{ left: `${entryPct}%` }} />

      {/* Spot marker */}
      {spotPct !== null && (
        <div
          className="absolute top-1 bottom-1 w-1.5 rounded-full bg-mint shadow-[0_0_6px_rgba(73,231,178,0.5)]"
          style={{ left: `calc(${spotPct}% - 3px)` }}
        />
      )}

      {/* Labels */}
      <span className="absolute left-1 top-1/2 -translate-y-1/2 text-sm text-red font-mono">SL</span>
      <span className="absolute right-1 top-1/2 -translate-y-1/2 text-sm text-green font-mono">TP</span>
    </div>
  );
}

function DetailRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-text-dim">{label}</span>
      <span className={`text-base font-mono ${color ?? "text-text-primary"}`}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <p className="text-sm text-text-dim uppercase tracking-wider">{label}</p>
      <p className={`text-base font-mono font-semibold ${color}`}>{value}</p>
    </div>
  );
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
        active ? "text-text-primary border-mint" : "text-text-dim border-transparent hover:text-text-muted"
      }`}
    >
      {label}
    </button>
  );
}

function AnimatedCollapse({ open, children }: { open: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [visible, setVisible] = useState(false);

  const measure = useCallback(() => {
    if (ref.current) setHeight(ref.current.scrollHeight);
  }, []);

  useEffect(() => {
    if (open) {
      setVisible(true);
      // Delay measure to next frame so content is rendered
      requestAnimationFrame(measure);
    } else {
      setHeight(0);
      const t = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(t);
    }
  }, [open, measure]);

  // Re-measure when children change
  useEffect(() => {
    if (open) measure();
  });

  if (!visible && !open) return null;

  return (
    <div
      style={{ height, opacity: open ? 1 : 0 }}
      className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
    >
      <div ref={ref}>{children}</div>
    </div>
  );
}

function formatAge(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}
