"use client";

import { useEffect, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";

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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [amount, setAmount] = useState("");
  const [showDeposit, setShowDeposit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const apy = getApy(vault);
  const tvl = getTvl(vault);
  const supplyApy = parseFloat(vault.supplyRate) / 100;
  const rewardsApy = parseFloat(vault.rewardsRate) / 100;
  const barWidth = topApy > 0 ? (apy / topApy) * 100 : 0;
  const isTop = rank <= 3;

  async function handleDeposit() {
    if (!connected || !publicKey || !signTransaction) { setVisible(true); return; }
    if (!amount || parseFloat(amount) <= 0) return;

    setBusy(true);
    setStatus("Building...");
    try {
      const amountSmallest = Math.floor(parseFloat(amount) * Math.pow(10, vault.decimals)).toString();
      const res = await fetch("/api/lend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", asset: vault.assetAddress, amount: amountSmallest, signer: publicKey.toBase58() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed");
      const { transaction: txBase64 } = await res.json();

      setStatus("Sign...");
      const tx = VersionedTransaction.deserialize(Buffer.from(txBase64, "base64"));
      const signed = await signTransaction(tx);

      setStatus("Sending...");
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false });
      await connection.confirmTransaction(sig, "confirmed");

      setStatus("Deposited!");
      setAmount("");
      setTimeout(() => { setStatus(""); setShowDeposit(false); }, 2000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setStatus(msg.includes("rejected") ? "Cancelled" : msg.slice(0, 40));
      setTimeout(() => setStatus(""), 4000);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg bg-bg-inset border border-border-subtle hover:border-mint/20 transition-colors group">
      <button
        onClick={() => setShowDeposit(!showDeposit)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
      >
        <span className={`w-5 text-center text-xs font-mono font-bold ${isTop ? "text-mint" : "text-text-dim"}`}>{rank}</span>
        <div className="w-7 h-7 rounded-full overflow-hidden bg-bg-card border border-border shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={vault.asset.logoUrl} alt={vault.asset.uiSymbol} className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-primary">{vault.asset.uiSymbol}</span>
              <span className="text-xs text-text-dim truncate">{vault.asset.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-text-dim font-mono">${formatCompact(tvl)}</span>
              <span className={`text-sm font-mono font-bold ${isTop ? "text-mint" : "text-text-secondary"}`}>{apy.toFixed(2)}%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${isTop ? "bg-mint" : "bg-mint/30"}`} style={{ width: `${barWidth}%` }} />
            </div>
            <span className="text-xs text-text-dim font-mono shrink-0">{supplyApy.toFixed(1)}% + {rewardsApy.toFixed(1)}%r</span>
          </div>
        </div>
      </button>

      {showDeposit && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle animate-fadeIn">
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              placeholder={`Amount ${vault.asset.uiSymbol}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-bg-card border border-border rounded-md px-2 py-1.5 text-sm font-mono text-text-primary"
            />
            <button
              onClick={handleDeposit}
              disabled={busy}
              className="px-3 py-1.5 rounded-md text-sm font-semibold bg-mint text-bg-base hover:bg-mint-dark disabled:opacity-50 transition-colors"
            >
              {busy ? status : "Deposit"}
            </button>
          </div>
          {status && !busy && (
            <p className={`text-xs mt-1 ${status === "Deposited!" ? "text-green" : status === "Cancelled" ? "text-text-dim" : "text-red"}`}>{status}</p>
          )}
        </div>
      )}
    </div>
  );
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`;
  return n.toFixed(0);
}
