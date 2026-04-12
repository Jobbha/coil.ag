"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@solana/wallet-adapter-react";
import { getPoints } from "@/lib/convexSync";
import ThemeToggle from "./ThemeToggle";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["Spot", "Perps", "DCA", "Predict", "Yield", "Orders", "Profile"];

export default function TopNav({ activeTab, onTabChange }: Props) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { publicKey } = useWallet();
  const [pts, setPts] = useState(0);

  useEffect(() => {
    if (!authenticated || !publicKey) return;
    getPoints(publicKey.toBase58()).then((p) => {
      if (p?.total) setPts(p.total);
    }).catch(() => {});
  }, [authenticated, publicKey]);

  return (
    <nav className="border-b border-border-subtle">
      {/* Top bar: logo + right controls */}
      <div className="flex items-center justify-between px-3 md:px-6 py-2 md:py-3">
        {/* Logo — bigger */}
        <Image src="/coil-logo.png" alt="Coil" width={120} height={48} className="object-contain w-[90px] md:w-[120px]" priority />

        {/* Right controls */}
        <div className="flex items-center gap-1.5 md:gap-2.5">
          <a
            href="https://coil-1.gitbook.io/coil-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-2 py-1 md:py-1.5 rounded-lg text-xs text-text-secondary hover:text-mint transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span className="hidden sm:inline">Docs</span>
          </a>
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-bg-inset border border-border text-xs text-text-secondary">
            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-purple-500 to-teal-400" />
            Solana
          </div>
          <ThemeToggle />
          {ready && !authenticated && (
            <button
              onClick={() => login()}
              className="px-3 md:px-4 py-1.5 rounded-lg bg-mint text-bg-base text-xs font-semibold
                         hover:bg-mint-dark transition-colors shadow-[0_0_12px_var(--mint-glow)]"
            >
              Log In
            </button>
          )}
          {ready && authenticated && (
            <div className="flex items-center gap-1">
              {pts > 0 && (
                <button
                  onClick={() => onTabChange("Profile")}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-mint/10 border border-mint/20 hover:bg-mint/20 transition-all"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-mint">
                    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
                  </svg>
                  <span className="text-xs font-bold font-mono text-mint">{pts}</span>
                </button>
              )}
              <button
                onClick={() => onTabChange("Profile")}
                className="flex items-center gap-1.5 px-2 md:px-3 py-1.5 rounded-lg bg-bg-card border border-border
                           hover:border-mint/30 transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-mint/60 to-mint flex items-center justify-center text-[10px] font-bold text-bg-base">
                  {(user?.email?.address?.[0] ?? user?.google?.email?.[0] ?? "U").toUpperCase()}
                </div>
                <span className="hidden sm:inline text-xs font-medium text-text-secondary max-w-[100px] truncate">
                  {user?.email?.address ?? user?.google?.email ?? "Account"}
                </span>
              </button>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded-lg border border-border text-text-dim hover:border-red/30 hover:text-red transition-colors"
                title="Log out"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab bar — separate row, full width scroll on mobile */}
      <div className="flex items-center gap-0.5 px-3 md:px-6 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab
                ? "bg-mint text-bg-base"
                : "text-text-muted hover:text-text-primary"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
}
