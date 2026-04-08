"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import type { CoilOrder } from "@/lib/coilEngine";
import { createOrder, KNOWN_MINTS } from "@/lib/coilEngine";
import { getJlToken } from "@/lib/jlTokens";
import type { TokenListItem } from "@/lib/tokens";

interface VaultOption {
  symbol: string;
  uiSymbol: string;
  assetAddress: string;
  logoUrl: string;
  totalRate: string;
  supplyRate: string;
  rewardsRate: string;
  totalAssets: string;
  decimals: number;
  price: string;
}

interface Props {
  token: TokenListItem;
  onSubmit: (order: CoilOrder) => void;
  onBack: () => void;
  disabled?: boolean;
  onTargetPriceChange?: (price: number | null) => void;
}

export default function SetupForm({ token, onSubmit, onBack, onTargetPriceChange }: Props) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const spotPrice = token.usdPrice ?? 0;
  const [targetPrice, setTargetPrice] = useState(() =>
    spotPrice ? (spotPrice * 0.95).toFixed(4) : "",
  );
  const [takeProfit, setTakeProfit] = useState(() =>
    spotPrice ? (spotPrice * 1.15).toFixed(4) : "",
  );
  const [stopLoss, setStopLoss] = useState(() =>
    spotPrice ? (spotPrice * 0.85).toFixed(4) : "",
  );
  const [capital, setCapital] = useState("500");
  const [threshold, setThreshold] = useState("3");
  const [showDetails, setShowDetails] = useState(false);
  const [showTpSl, setShowTpSl] = useState(false);
  const [expandedVault, setExpandedVault] = useState("");

  // Tx state
  const [submitting, setSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  // Yield vault selection
  const [vaults, setVaults] = useState<VaultOption[]>([]);
  const [selectedVault, setSelectedVault] = useState<string>(""); // assetAddress

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
          supplyRate: v.supplyRate ?? "0",
          rewardsRate: v.rewardsRate ?? "0",
          totalAssets: v.totalAssets ?? "0",
          decimals: v.decimals ?? 6,
          price: v.asset?.price ?? "0",
        }));
        setVaults(opts);
        // Default to USDC vault
        const usdc = opts.find((v) => v.uiSymbol === "USDC");
        if (usdc) setSelectedVault(usdc.assetAddress);
        else if (opts.length > 0) setSelectedVault(opts[0].assetAddress);
      })
      .catch(() => {});
  }, []);

  const activeVault = vaults.find((v) => v.assetAddress === selectedVault);
  const vaultApy = activeVault ? parseFloat(activeVault.totalRate) / 100 : 5.0;

  // Notify parent of target price changes
  useEffect(() => {
    const val = parseFloat(targetPrice);
    onTargetPriceChange?.(isNaN(val) ? null : val);
    return () => onTargetPriceChange?.(null);
  }, [targetPrice, onTargetPriceChange]);

  const capitalNum = parseFloat(capital) || 0;
  const estDailyYield = (capitalNum * (vaultApy / 100)) / 365;
  const targetDist = spotPrice && targetPrice ? ((spotPrice - parseFloat(targetPrice)) / spotPrice) * 100 : 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // If wallet not connected, open wallet modal
    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }

    setSubmitting(true);
    setTxStatus("Building deposit...");

    try {
      const assetMint = activeVault?.assetAddress ?? KNOWN_MINTS.USDC;
      const decimals = activeVault?.decimals ?? 6;
      const amount = Math.floor(parseFloat(capital) * Math.pow(10, decimals)).toString();

      // 1. Build Lend deposit tx via API
      const res = await fetch("/api/lend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deposit",
          asset: assetMint,
          amount,
          signer: publicKey.toBase58(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to build deposit transaction");
      }

      const { transaction: txBase64 } = await res.json();

      // 2. Deserialize and sign
      setTxStatus("Sign in wallet...");
      const txBytes = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);

      // 3. Send to chain
      setTxStatus("Sending...");
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      // 4. Confirm
      setTxStatus("Confirming...");
      await connection.confirmTransaction(sig, "confirmed");

      // 5. Create order with real tx signature
      const jlToken = getJlToken(assetMint);
      const order = createOrder({
        inputMint: assetMint,
        outputMint: token.mint,
        targetPrice: parseFloat(targetPrice),
        takeProfitPrice: parseFloat(takeProfit) || 0,
        stopLossPrice: parseFloat(stopLoss) || 0,
        capitalAmount: amount,
        proximityThreshold: parseFloat(threshold) / 100,
        yieldMint: jlToken?.jlMint ?? null,
        yieldSymbol: jlToken?.jlSymbol ?? null,
        strategy: "limit",
      });
      order.lendTxSignature = sig;

      onSubmit(order);
      setTxStatus("");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      if (msg.includes("User rejected") || msg.includes("cancelled")) {
        setTxStatus("Cancelled");
      } else {
        setTxStatus(msg.length > 80 ? msg.slice(0, 80) + "..." : msg);
      }
      setTimeout(() => setTxStatus(""), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  const ctaLabel = submitting
    ? txStatus
    : !connected
      ? "Connect Wallet"
      : `Start Coil — $${token.symbol}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="w-6 h-6 rounded-md bg-bg-inset border border-border flex items-center justify-center
                       text-text-muted hover:text-text-primary hover:border-mint/30 transition-all text-sm"
          >
            ←
          </button>
          <div className="w-5 h-5 rounded-full overflow-hidden bg-bg-inset shrink-0">
            {token.icon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-bold text-text-muted">
                {token.symbol.slice(0, 2)}
              </div>
            )}
          </div>
          <span className="text-sm font-semibold text-text-primary">${token.symbol}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-mint/10 border border-mint/20">
          <div className="w-1 h-1 rounded-full bg-mint animate-pulse" />
          <span className="text-sm font-medium text-mint">~{vaultApy.toFixed(1)}% APY</span>
        </div>
      </div>

      {/* Capital input */}
      <div className="bg-bg-inset rounded-lg p-3.5 border border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-text-muted flex items-center gap-1.5">You deposit <InfoTip text="USDC amount to deposit. This capital earns yield in Jupiter Lend while waiting for your limit price." /></span>
          <span className="text-sm text-text-dim">~${estDailyYield.toFixed(4)}/day</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={capital}
            onChange={(e) => setCapital(e.target.value)}
            required
            className="input-inline flex-1 min-w-0 text-base font-mono font-semibold text-text-primary"
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-card border border-border shrink-0">
            <div className="w-3.5 h-3.5 rounded-full bg-blue flex items-center justify-center text-sm font-bold text-white">$</div>
            <span className="text-sm font-medium">USDC</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="flex items-center justify-center -my-1">
        <div className="w-6 h-6 rounded-md bg-bg-card border border-border flex items-center justify-center text-mint">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M7 1v12M3 9l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* Target price */}
      <div className="bg-bg-inset rounded-lg p-3.5 border border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-text-muted flex items-center gap-1.5">Buy ${token.symbol} at <InfoTip text="Your target entry price. When spot price approaches this level, capital is withdrawn from Lend and a limit order is placed." /></span>
          {spotPrice > 0 && (
            <span className="text-sm text-text-dim">
              Spot: ${formatPrice(spotPrice)} ({targetDist > 0 ? '-' : '+'}{Math.abs(targetDist).toFixed(1)}%)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            step="any"
            placeholder="0.00"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            required
            className="input-inline flex-1 min-w-0 text-base font-mono font-semibold text-text-primary"
          />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bg-card border border-border shrink-0">
            <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-bg-inset shrink-0">
              {token.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={token.icon} alt={token.symbol} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm font-bold text-text-muted">{token.symbol.slice(0,2)}</div>
              )}
            </div>
            <span className="text-sm font-medium">{token.symbol}</span>
          </div>
        </div>

        {/* % slider */}
        {spotPrice > 0 && (
          <div className="mt-2 space-y-1">
            <input
              type="range"
              min="-30"
              max="30"
              step="0.5"
              value={-targetDist}
              onChange={(e) => {
                const pct = -parseFloat(e.target.value);
                setTargetPrice((spotPrice * (1 - pct / 100)).toFixed(4));
              }}
              className="w-full h-1 rounded-full appearance-none cursor-pointer
                         bg-border accent-mint [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-mint
                         [&::-webkit-slider-thumb]:shadow-[0_0_6px_rgba(73,231,178,0.4)]"
            />
            <div className="flex items-center justify-between text-sm text-text-dim">
              <span>-30%</span>
              <span className={`font-mono font-medium text-sm ${targetDist > 0 ? "text-red" : targetDist < 0 ? "text-green" : "text-mint"}`}>
                {targetDist > 0 ? '-' : targetDist < 0 ? '+' : ''}{Math.abs(targetDist).toFixed(1)}% from spot
              </span>
              <span>+30%</span>
            </div>
          </div>
        )}
      </div>

      {/* TP / SL (optional, collapsible) */}
      <button
        type="button"
        onClick={() => setShowTpSl(!showTpSl)}
        className="flex items-center justify-between w-full text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <span className="flex items-center gap-1.5">
          TP / SL
          <InfoTip text="Optional. Set take-profit and stop-loss to auto-exit. Without these, Coil places a simple limit order." />
          {!showTpSl && takeProfit && stopLoss && (
            <span className="text-xs text-text-dim font-mono">
              <span className="text-green">{parseFloat(takeProfit).toFixed(0)}</span>
              {" / "}
              <span className="text-red">{parseFloat(stopLoss).toFixed(0)}</span>
            </span>
          )}
        </span>
        <svg width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform ${showTpSl ? 'rotate-180' : ''}`}>
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>
      {showTpSl && (
        <div className="grid grid-cols-2 gap-2">
          <div className="min-w-0">
            <label className="text-xs text-text-dim mb-0.5 block">Take Profit</label>
            <div className="flex items-center bg-bg-inset rounded-md border border-border px-2 py-1.5">
              <span className="text-green text-sm mr-1.5">↑</span>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="Optional"
                className="input-inline flex-1 min-w-0 text-base font-mono text-text-primary"
              />
            </div>
          </div>
          <div className="min-w-0">
            <label className="text-xs text-text-dim mb-0.5 block">Stop Loss</label>
            <div className="flex items-center bg-bg-inset rounded-md border border-border px-2 py-1.5">
              <span className="text-red text-sm mr-1.5">↓</span>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="Optional"
                className="input-inline flex-1 min-w-0 text-base font-mono text-text-primary"
              />
            </div>
          </div>
        </div>
      )}

      {/* Yield vault picker */}
      {vaults.length > 0 && (
        <div>
          <label className="text-sm text-text-muted mb-1.5 flex items-center gap-1.5">Earn yield in <InfoTip text="Choose which Jupiter Lend vault to earn yield in while your capital waits. Different vaults offer different APYs." /></label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {vaults.map((v) => {
              const apy = parseFloat(v.totalRate) / 100;
              const isSelected = v.assetAddress === selectedVault;
              const isExpanded = isSelected && expandedVault === v.assetAddress;

              return (
                <button
                  key={v.assetAddress}
                  type="button"
                  onClick={() => {
                    setSelectedVault(v.assetAddress);
                    setExpandedVault(isExpanded ? "" : v.assetAddress);
                  }}
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

          {/* Expanded detail for selected vault */}
          {expandedVault && (() => {
            const v = vaults.find((x) => x.assetAddress === expandedVault);
            if (!v) return null;
            const apy = parseFloat(v.totalRate) / 100;
            const supplyApy = parseFloat(v.supplyRate) / 100;
            const rewardsApy = parseFloat(v.rewardsRate) / 100;
            const tvl = parseFloat(v.totalAssets) / Math.pow(10, v.decimals) * parseFloat(v.price);
            const dailyYield = capitalNum > 0 ? (capitalNum * (apy / 100)) / 365 : 0;
            return (
              <div className="mt-1.5 px-3 py-2 rounded-lg bg-bg-inset border border-border-subtle text-xs space-y-1 animate-fadeIn">
                <div className="flex justify-between">
                  <span className="text-text-dim">Vault token</span>
                  <span className="text-text-secondary font-mono">{v.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">TVL</span>
                  <span className="text-text-secondary font-mono">${formatCompact(tvl)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Supply APY</span>
                  <span className="text-mint font-mono">{supplyApy.toFixed(2)}%</span>
                </div>
                {rewardsApy > 0 && (
                  <div className="flex justify-between">
                    <span className="text-text-dim">Rewards APY</span>
                    <span className="text-mint font-mono">{rewardsApy.toFixed(2)}%</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-dim">Est. daily</span>
                  <span className="text-mint font-mono font-semibold">${dailyYield.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-dim">Est. monthly</span>
                  <span className="text-mint font-mono font-semibold">${(dailyYield * 30).toFixed(2)}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Threshold */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-muted flex items-center gap-1.5">Trigger threshold <InfoTip text="When spot price is within this % of your target, capital is withdrawn from Lend and the limit order is placed on Jupiter Trigger." /></span>
        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            min="0.5"
            max="20"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
            className="w-14 text-center bg-bg-inset border border-border rounded-md px-2 py-1 text-sm font-mono"
          />
          <span className="text-sm text-text-muted">%</span>
        </div>
      </div>

      {/* More info */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center justify-between w-full text-sm text-text-muted hover:text-text-secondary transition-colors"
      >
        <span className="uppercase tracking-wider font-medium">More Info</span>
        <svg
          width="8" height="5" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`transition-transform ${showDetails ? 'rotate-180' : ''}`}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {showDetails && (
        <div className="space-y-1 text-sm">
          <InfoRow label="Yield token" value={activeVault ? `jl${activeVault.uiSymbol}` : "None"} accent />
          <InfoRow label="APY" value={`${vaultApy.toFixed(2)}%`} accent />
          <InfoRow label="Daily yield" value={`$${estDailyYield.toFixed(4)}`} accent />
          <InfoRow label="Distance" value={`${Math.abs(targetDist).toFixed(2)}% from spot`} />
          <InfoRow label="Order type" value={takeProfit || stopLoss ? "OTOCO (with TP/SL)" : "Limit"} />
          <InfoRow label="Flow" value={activeVault ? `${activeVault.uiSymbol} → jl${activeVault.uiSymbol} → ${token.symbol}` : "Direct"} />
          <InfoRow label="Exit" value="1 tx via Jupiter routing" />
          <InfoRow label="Min. trade" value="$10" />
        </div>
      )}

      {/* CTA */}
      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all
                   ${submitting
                     ? "bg-bg-inset border border-border text-text-muted cursor-wait"
                     : "bg-mint text-bg-base hover:bg-mint-dark shadow-[0_0_16px_rgba(73,231,178,0.15)] animate-mintPulse"
                   }
                   disabled:cursor-wait`}
      >
        {ctaLabel}
      </button>

      {/* Tx status message */}
      {txStatus && !submitting && (
        <p className={`text-center text-sm ${txStatus.includes("Cancelled") ? "text-text-dim" : "text-red"}`}>
          {txStatus}
        </p>
      )}
    </form>
  );
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-border-subtle last:border-0">
      <span className="text-text-muted">{label}</span>
      <span className={accent ? "text-mint font-mono" : "text-text-primary font-mono"}>{value}</span>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        onClick={() => setShow(!show)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="w-3.5 h-3.5 rounded-full border border-text-dim text-text-dim flex items-center justify-center
                   text-[9px] font-bold hover:border-mint/50 hover:text-mint transition-colors leading-none"
      >
        i
      </button>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 rounded-md
                         bg-bg-card border border-border shadow-card text-xs text-text-secondary
                         whitespace-normal w-40 md:w-48 z-50 animate-fadeIn leading-relaxed pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toFixed(2);
  if (price >= 0.01) return price.toFixed(4);
  return price.toFixed(6);
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}
