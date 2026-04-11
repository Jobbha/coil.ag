"use client";

import Image from "next/image";
import { usePrivy } from "@privy-io/react-auth";
import ThemeToggle from "./ThemeToggle";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["Spot", "Perps", "DCA", "Predict", "Yield", "Orders", "Profile"];

export default function TopNav({ activeTab, onTabChange }: Props) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const tabs = TABS;

  return (
    <nav className="flex items-center justify-between px-6 py-4 border-b border-border-subtle">
      {/* Logo */}
      <div className="flex items-center">
        <Image src="/coil-logo.png" alt="Coil" width={100} height={40} className="object-contain" priority />
      </div>

      {/* Center nav tabs — scrollable on mobile */}
      <div className="flex items-center bg-bg-inset rounded-xl p-1 gap-0.5 overflow-x-auto max-w-[60%] md:max-w-none">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`px-3 md:px-4 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === tab
                ? "bg-mint text-white dark:text-bg-base"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab === "Profile" ? (
              <span className="flex items-center gap-1.5">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
                </svg>
                {tab}
              </span>
            ) : tab}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        <a
          href="https://coil-1.gitbook.io/coil-docs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm text-text-secondary hover:text-mint transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          Docs
        </a>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-inset border border-border text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-teal-400" />
          Solana
        </div>
        <ThemeToggle />
        {ready && !authenticated && (
          <button
            onClick={() => login()}
            className="px-5 py-2 rounded-xl bg-mint text-white dark:text-bg-base text-sm font-semibold uppercase tracking-wide
                       hover:bg-mint-dark transition-colors shadow-[0_0_16px_var(--mint-glow)]"
          >
            Log In
          </button>
        )}
        {ready && authenticated && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onTabChange("Profile")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-bg-card border border-border
                         hover:border-mint/30 transition-all"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-mint/60 to-mint flex items-center justify-center text-xs font-bold text-bg-base">
                {(user?.email?.address?.[0] ?? user?.google?.email?.[0] ?? "U").toUpperCase()}
              </div>
              <span className="text-sm font-medium text-text-secondary max-w-[120px] truncate">
                {user?.email?.address ?? user?.google?.email ?? "Account"}
              </span>
            </button>
            <button
              onClick={() => logout()}
              className="px-3 py-2 rounded-xl border border-border text-text-dim text-sm hover:border-red/30 hover:text-red transition-colors"
              title="Log out"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
