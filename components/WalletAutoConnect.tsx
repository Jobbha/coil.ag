"use client";

import { useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePrivy } from "@privy-io/react-auth";

/**
 * Bridges Privy auth → Solana wallet adapter.
 * When user logs in via Privy, auto-connects the best available wallet.
 */
export default function WalletAutoConnect() {
  const { authenticated, user } = usePrivy();
  const { wallets, select, connect, connected, wallet } = useWallet();
  const attempted = useRef(false);

  useEffect(() => {
    if (!authenticated || connected || attempted.current) return;
    if (wallets.length === 0) return;

    attempted.current = true;

    // Find the best wallet to auto-connect:
    // 1. Phantom (most common)
    // 2. Any wallet that's already readyState "Installed"
    // 3. First available
    const phantom = wallets.find((w) => w.adapter.name.toLowerCase().includes("phantom"));
    const installed = wallets.find((w) => w.readyState === "Installed");
    const target = phantom ?? installed ?? wallets[0];

    if (target) {
      try {
        select(target.adapter.name);
      } catch {
        // Silent — wallet may not be ready yet
      }
    }
  }, [authenticated, connected, wallets, select, connect, wallet]);

  // Reset attempt flag on logout
  useEffect(() => {
    if (!authenticated) {
      attempted.current = false;
    }
  }, [authenticated]);

  return null;
}
