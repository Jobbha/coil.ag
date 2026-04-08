"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { clusterApiUrl } from "@solana/web3.js";

import "@solana/wallet-adapter-react-ui/styles.css";

export default function WalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(() => {
    const rpc = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpc) return clusterApiUrl("mainnet-beta");
    // Relative URLs (like /api/rpc) need the origin prepended for SSR/build
    if (rpc.startsWith("/") && typeof window !== "undefined") {
      return `${window.location.origin}${rpc}`;
    }
    if (rpc.startsWith("/")) return clusterApiUrl("mainnet-beta"); // build-time fallback
    return rpc;
  }, []);

  // No explicit adapters needed — Phantom and Solflare register as Standard Wallets
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <SolanaWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
}
