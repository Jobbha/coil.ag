"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getUserByWallet, getReferralStats, getPoints } from "@/lib/convexSync";

export default function ProfileTab() {
  const { publicKey, wallet, disconnect, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const { logout: privyLogout, user: privyUser, authenticated } = usePrivy();
  const [balance, setBalance] = useState<number | null>(null);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralCount, setReferralCount] = useState(0);
  const [referralCopied, setReferralCopied] = useState(false);
  const [points, setPoints] = useState<{ total: number; breakdown: { orders: number; referrals: number; yield: number } } | null>(null);

  const addr = publicKey?.toBase58() ?? "";
  const short = addr ? `${addr.slice(0, 6)}...${addr.slice(-6)}` : "";
  const privyEmail = privyUser?.email?.address ?? privyUser?.google?.email ?? null;

  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((b) => setBalance(b / LAMPORTS_PER_SOL)).catch(() => {});
    // Fetch referral code + stats from Convex
    const addr = publicKey.toBase58();
    getUserByWallet(addr).then((user) => {
      if (user?.referralCode) setReferralCode(user.referralCode);
    }).catch(() => {});
    getReferralStats(addr).then((stats) => {
      if (stats?.count) setReferralCount(stats.count);
    }).catch(() => {});
    getPoints(addr).then((p) => {
      if (p?.total !== undefined) setPoints(p);
    }).catch(() => {});
    // Fetch live SOL price
    fetch("/api/price?ids=So11111111111111111111111111111111111111112")
      .then((r) => r.json())
      .then((d) => {
        const p = d["So11111111111111111111111111111111111111112"];
        if (p?.usdPrice) setSolPrice(p.usdPrice);
      })
      .catch(() => {});
  }, [publicKey, connection]);

  function copyAddress() {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-bg-inset border border-border flex items-center justify-center mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-text-dim">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
          </svg>
        </div>
        <p className="text-base text-text-muted">Log in to view your profile</p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-5">
      {/* Account card */}
      <div className="glass-card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-mint/40 to-mint flex items-center justify-center text-2xl font-bold text-bg-base shrink-0">
            {(privyEmail?.[0] ?? addr.slice(0, 2) ?? "U").toUpperCase()}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            {privyEmail && (
              <h2 className="text-xl font-bold text-text-primary mb-1">{privyEmail}</h2>
            )}
            {connected && publicKey ? (
              <div className="flex items-center gap-3 mb-1">
                <p className="text-sm text-text-dim font-mono truncate">{short}</p>
                <button
                  onClick={copyAddress}
                  className="px-2 py-0.5 rounded-md text-sm text-text-muted border border-border hover:border-mint/30 hover:text-mint transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-dim mb-1">No wallet connected</p>
            )}

            <div className="flex items-center gap-4 mt-2">
              {wallet?.adapter?.name && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green" />
                  <span className="text-sm text-text-muted">{wallet.adapter.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${authenticated ? "bg-green" : "bg-text-dim"}`} />
                <span className="text-sm text-text-muted">Privy {authenticated ? "Connected" : "Disconnected"}</span>
              </div>
              <span className="text-sm text-text-dim">Solana Mainnet</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            {connected && addr ? (
              <>
                <a
                  href={`https://solscan.io/account/${addr}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary
                             hover:border-mint/30 hover:text-mint transition-colors text-center"
                >
                  Solscan
                </a>
                <button
                  onClick={disconnect}
                  className="px-3 py-2 rounded-lg text-sm font-medium border border-border text-text-secondary
                             hover:border-red/30 hover:text-red transition-colors"
                >
                  Disconnect Wallet
                </button>
              </>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="px-4 py-2 rounded-lg text-sm font-semibold bg-mint text-bg-base
                           hover:bg-mint-dark transition-colors shadow-[0_0_12px_var(--mint-glow)]"
              >
                Connect Wallet
              </button>
            )}
            <button
              onClick={() => privyLogout()}
              className="px-3 py-2 rounded-lg text-sm font-medium border border-red/20 text-red hover:bg-red/5 transition-colors"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-3 md:p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">SOL Balance</p>
          <p className="text-xl font-bold font-mono text-text-primary">
            {connected && balance !== null ? balance.toFixed(4) : "—"}
          </p>
          <p className="text-xs text-text-muted mt-1">
            {connected && balance !== null && solPrice ? `≈ $${(balance * solPrice).toFixed(2)}` : connected ? "Loading..." : "Connect wallet"}
          </p>
        </div>

        <div className="glass-card p-3 md:p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">Coil Points</p>
          <p className="text-xl font-bold font-mono text-mint">{points?.total ?? 0}</p>
          <p className="text-xs text-text-muted mt-1">
            {points ? `${points.breakdown.orders} orders · ${points.breakdown.referrals} referrals` : "Earn by trading"}
          </p>
        </div>

        <div className="glass-card p-3 md:p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">Referrals</p>
          <p className="text-xl font-bold font-mono text-mint">{referralCount}</p>
          <p className="text-xs text-text-muted mt-1">{referralCount > 0 ? `${referralCount * 50} pts earned` : "Share your link"}</p>
        </div>

        <div className="glass-card p-3 md:p-5">
          <p className="text-sm text-text-dim uppercase tracking-wider mb-1">Total Yield</p>
          <p className="text-xl font-bold font-mono text-mint">{points?.breakdown.yield ? `$${(points.breakdown.yield / 10).toFixed(2)}` : "—"}</p>
          <p className="text-xs text-text-muted mt-1">Across all orders</p>
        </div>
      </div>

      {/* Privy account details */}
      {privyUser && (
        <div className="glass-card p-3 md:p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Account Details</h3>
          <div className="space-y-3">
            {privyEmail && (
              <DetailRow label="Email" value={privyEmail} />
            )}
            <DetailRow label="User ID" value={privyUser.id} />
            {privyUser.createdAt && (
              <DetailRow label="Joined" value={new Date(privyUser.createdAt).toLocaleDateString()} />
            )}
            {connected && addr && (
              <DetailRow label="Wallet" value={`${addr.slice(0, 8)}...${addr.slice(-8)}`} />
            )}
          </div>
        </div>
      )}

      {/* Referral */}
      {referralCode && (
        <div className="glass-card p-3 md:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-text-primary">Referral Program</h3>
            {referralCount > 0 && (
              <span className="text-sm font-mono text-mint font-bold">{referralCount} referred</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-bg-inset border border-border rounded-lg px-3 py-2 font-mono text-sm text-mint truncate">
              {typeof window !== "undefined" ? `${window.location.origin}?ref=${referralCode}` : referralCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}?ref=${referralCode}`);
                setReferralCopied(true);
                setTimeout(() => setReferralCopied(false), 2000);
              }}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-mint text-bg-base hover:bg-mint-dark transition-colors"
            >
              {referralCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <p className="text-xs text-text-dim mt-2">Share this link to invite others to Coil</p>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0">
      <span className="text-sm text-text-dim">{label}</span>
      <span className="text-sm text-text-primary font-mono truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}
