"use client";

import { type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: true });

export default function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#49E7B2",
          logo: "/coil-logo.png",
          walletChainType: "solana-only",
          showWalletLoginFirst: true,
          walletList: ["phantom", "solflare", "detected_wallets"],
        },
        loginMethods: ["wallet", "email", "google"],
        embeddedWallets: {
          solana: { createOnLogin: "all-users" },
          ethereum: { createOnLogin: "off" },
        },
        externalWallets: {
          solana: { connectors: solanaConnectors },
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
