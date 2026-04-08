"use client";

import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import WalletButton from "./WalletButton";
import ThemeToggle from "./ThemeToggle";

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const BASE_TABS = ["Spot", "Perps", "DCA", "Predict", "Yield", "Orders"];

export default function TopNav({ activeTab, onTabChange }: Props) {
  const { connected } = useWallet();
  const tabs = connected ? [...BASE_TABS, "Profile"] : BASE_TABS;

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
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-bg-inset border border-border text-sm text-text-secondary">
          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-500 to-teal-400" />
          Solana
        </div>
        <ThemeToggle />
        <WalletButton onViewProfile={() => onTabChange("Profile")} />
      </div>
    </nav>
  );
}
