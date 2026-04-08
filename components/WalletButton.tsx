"use client";

import { useState, useRef, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function WalletButton({ onViewProfile }: { onViewProfile?: () => void } = {}) {
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!connected || !publicKey) {
    return (
      <button
        onClick={() => setVisible(true)}
        className="px-5 py-2 rounded-xl bg-mint text-white dark:text-bg-base text-sm font-semibold uppercase tracking-wide
                   hover:bg-mint-dark transition-colors shadow-[0_0_16px_var(--mint-glow)]"
      >
        Connect Wallet
      </button>
    );
  }

  const addr = publicKey.toBase58();
  const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-card border border-border
                   hover:border-mint/30 transition-all"
      >
        {/* Wallet icon */}
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mint/60 to-mint flex items-center justify-center text-sm font-bold text-bg-base">
          {addr.slice(0, 2)}
        </div>
        <span className="text-base font-mono text-text-secondary">{short}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
          className={`text-text-dim transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M1 1l4 4 4-4" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 glass-card p-0 z-50 animate-slideDown overflow-hidden">
          {/* Profile header */}
          <div className="px-4 py-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-mint/40 to-mint flex items-center justify-center text-sm font-bold text-bg-base">
                {addr.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary">{short}</p>
                <p className="text-sm text-text-dim truncate">{addr}</p>
              </div>
            </div>
            {wallet?.adapter?.name && (
              <div className="flex items-center gap-1.5 mt-2">
                <div className="w-3 h-3 rounded-full bg-green" />
                <span className="text-sm text-text-muted">
                  Connected via {wallet.adapter.name}
                </span>
              </div>
            )}
          </div>

          {/* Menu items */}
          <div className="py-1">
            <MenuItem
              icon={<ProfileIcon />}
              label="View Profile"
              sub="Dashboard & balances"
              onClick={() => {
                onViewProfile?.();
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<CopyIcon />}
              label="Copy Address"
              onClick={() => {
                navigator.clipboard.writeText(addr);
                setOpen(false);
              }}
            />
            <MenuItem
              icon={<WalletIcon />}
              label="Change Wallet"
              onClick={() => {
                setVisible(true);
                setOpen(false);
              }}
            />
          </div>

          {/* Disconnect */}
          <div className="border-t border-border-subtle p-1">
            <button
              onClick={() => {
                disconnect();
                setOpen(false);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-red text-sm font-medium
                         hover:bg-red/5 transition-colors"
            >
              <LogoutIcon />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-3 py-2 mx-1 rounded-lg text-sm text-text-primary
                 hover:bg-bg-card-hover transition-colors"
      style={{ width: "calc(100% - 8px)" }}
    >
      <span className="text-text-muted">{icon}</span>
      <span className="flex-1 text-left">
        {label}
        {sub && <span className="block text-sm text-text-dim">{sub}</span>}
      </span>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-dim">
        <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function ProfileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="2" y="6" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
      <circle cx="17" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
