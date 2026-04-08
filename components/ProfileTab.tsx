"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function ProfileTab() {
  const { publicKey, wallet, disconnect } = useWallet();
  const { connection } = useConnection();
  const [balance, setBalance] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const addr = publicKey?.toBase58() ?? "";
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
  }, [publicKey, connection]);

  function copyAddress() {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!publicKey) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-bg-inset border border-border flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-dim">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
          </svg>
        </div>
        <p className="text-base text-text-muted">Connect your wallet to view your profile</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-5">
      {/* Profile card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/40 to-mint flex items-center justify-center text-2xl font-bold text-bg-base shrink-0">
            {addr.slice(0, 2)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-xl font-bold text-text-primary font-mono">{short}</h2>
              <button
                onClick={copyAddress}
                className="px-2 py-0.5 rounded-md text-sm text-text-muted border border-border hover:border-mint/30 hover:text-mint transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <p className="text-sm text-text-dim font-mono truncate mb-3">{addr}</p>

            <div className="flex items-center gap-4">
              {wallet?.adapter?.name && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-sm text-text-muted">{wallet.adapter.name}</span>
                </div>
              )}
              <span className="text-sm text-text-dim">Solana Mainnet</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <a
              href={`https://solscan.io/account/${addr}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary
                         hover:border-mint/30 hover:text-mint transition-colors"
            >
              View on Solscan ↗
            </a>
            <button
              onClick={disconnect}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-red/20 text-red
                         hover:bg-red/5 transition-colors"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>

      {/* Balances + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">SOL Balance</p>
          <p className="text-2xl font-bold font-mono text-text-primary">
            {balance !== null ? balance.toFixed(4) : "—"}
          </p>
          <p className="text-sm text-text-muted mt-1">
            {balance !== null ? `≈ $${(balance * 82).toFixed(2)}` : "Loading..."}
          </p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">Active Coil Orders</p>
          <p className="text-2xl font-bold font-mono text-mint">—</p>
          <p className="text-sm text-text-muted mt-1">Check the Dashboard tab</p>
        </div>

        <div className="glass-card p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">Total Yield Earned</p>
          <p className="text-2xl font-bold font-mono text-mint">—</p>
          <p className="text-sm text-text-muted mt-1">Across all orders</p>
        </div>
      </div>

      {/* Recent activity */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Wallet Activity</h3>
        <div className="space-y-3">
          <ActivityRow label="Connected wallet" time="Just now" icon="🔗" />
          <ActivityRow label="Viewing Coil dashboard" time="Now" icon="👁" />
        </div>
        <a
          href={`https://solscan.io/account/${addr}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-sm text-mint hover:text-mint-dark transition-colors mt-4 pt-3 border-t border-border-subtle"
        >
          View full transaction history on Solscan ↗
        </a>
      </div>
    </div>
  );
}

function ActivityRow({ label, time, icon }: { label: string; time: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="w-8 h-8 rounded-lg bg-bg-inset border border-border flex items-center justify-center text-sm">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm text-text-primary">{label}</p>
      </div>
      <span className="text-sm text-text-dim">{time}</span>
    </div>
  );
}
