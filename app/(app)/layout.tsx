"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import TopNav from "@/components/TopNav";
import TickerStrip from "@/components/TickerStrip";
import { useCoilEngine } from "@/lib/useCoilEngine";
import { syncOrderCreate, syncOrderCancel, syncUser, awardPoints } from "@/lib/convexSync";
import { POPULAR_TOKENS, type TokenListItem } from "@/lib/tokens";
import type { CoilOrder } from "@/lib/coilEngine";

type PriceMap = Record<string, { usdPrice: number; priceChange24h: number }>;

// Map pathnames to tab names
function getTabFromPath(path: string): string {
  if (path.startsWith("/spot")) return "Spot";
  if (path.startsWith("/dca")) return "DCA";
  if (path.startsWith("/perps")) return "Perps";
  if (path.startsWith("/predict")) return "Predict";
  if (path.startsWith("/yield")) return "Yield";
  if (path.startsWith("/orders")) return "Orders";
  if (path.startsWith("/profile")) return "Profile";
  return "Spot";
}

// Context to share engine state across pages
import { createContext, useContext } from "react";

interface AppContextType {
  orders: CoilOrder[];
  addOrder: (order: CoilOrder) => void;
  removeOrder: (orderId: string) => void;
  updateOrder: (orderId: string, updates: Partial<CoilOrder>) => void;
  prices: PriceMap;
  setPrices: React.Dispatch<React.SetStateAction<PriceMap>>;
  handleOrderSubmit: (order: CoilOrder) => void;
  handleOrderCancel: (orderId: string) => void;
}

export const AppContext = createContext<AppContextType | null>(null);
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppLayout");
  return ctx;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { authenticated, user: privyUser } = usePrivy();

  const signAndSend = useCallback(
    async (txBase64: string): Promise<string> => {
      if (!signTransaction) throw new Error("Wallet not connected");
      const txBytes = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [signTransaction, connection],
  );

  const { orders, addOrder, removeOrder, updateOrder } = useCoilEngine([], {
    walletAddress: publicKey?.toBase58() ?? null,
    signAndSend: signTransaction ? signAndSend : undefined,
  });

  const [prices, setPrices] = useState<PriceMap>({});
  const orderCountRef = useRef(0);

  // Sync user to Convex
  useEffect(() => {
    if (!authenticated || !privyUser?.id) return;
    const wallet = publicKey?.toBase58();
    const email = privyUser.email?.address ?? privyUser.google?.email;
    const ref = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("ref") ?? undefined : undefined;
    syncUser(privyUser.id, wallet, email, ref);
  }, [authenticated, privyUser, publicKey]);

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    const mints = POPULAR_TOKENS.map((t) => t.mint);
    try {
      const res = await fetch(`/api/price?ids=${mints.join(",")}`);
      if (!res.ok) return;
      const data = await res.json();
      const p: PriceMap = {};
      for (const [mint, info] of Object.entries(data)) {
        if (info && typeof info === "object" && "usdPrice" in info) {
          const i = info as { usdPrice: number; priceChange24h: number };
          p[mint] = { usdPrice: i.usdPrice, priceChange24h: i.priceChange24h };
        }
      }
      setPrices(p);
    } catch { /* */ }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  function handleOrderSubmit(order: CoilOrder) {
    addOrder(order);
    const wallet = publicKey?.toBase58();
    if (wallet) {
      syncOrderCreate(wallet, order);
      orderCountRef.current++;
      if (orderCountRef.current === 1) awardPoints(wallet, "first_order", "Placed first Coil order");
      awardPoints(wallet, "order_placed", `Placed ${order.strategy} order`);
    }
  }

  function handleOrderCancel(orderId: string) {
    removeOrder(orderId);
    const wallet = publicKey?.toBase58();
    if (wallet) syncOrderCancel(wallet);
  }

  function handleTabChange(tab: string) {
    const routes: Record<string, string> = {
      Spot: "/spot",
      DCA: "/dca",
      Perps: "/perps",
      Predict: "/predict",
      Yield: "/yield",
      Orders: "/orders",
      Profile: "/profile",
    };
    router.push(routes[tab] ?? "/spot");
  }

  function handleTokenClick(token: TokenListItem) {
    const tab = getTabFromPath(pathname);
    if (tab === "DCA") {
      router.push(`/dca/${token.symbol}`);
    } else {
      router.push(`/spot/${token.symbol}`);
    }
  }

  const activeTab = getTabFromPath(pathname);

  return (
    <AppContext.Provider value={{ orders, addOrder, removeOrder, updateOrder, prices, setPrices, handleOrderSubmit, handleOrderCancel }}>
      <div className="flex-1 flex flex-col items-center py-2 px-2 md:py-4 md:px-4">
        <div className="w-full max-w-[1800px] md:w-[95%] lg:w-[90%] app-shell flex flex-col min-h-[92vh]">
          <TopNav activeTab={activeTab} onTabChange={handleTabChange} />
          <TickerStrip onTokenClick={handleTokenClick} prices={prices} />

          <div className="flex-1 p-2 md:p-4">
            {children}
          </div>

          <footer className="border-t border-border-subtle px-6 py-6 mt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Product</h4>
                <div className="space-y-2">
                  <FooterLink label="Spot Trading" href="/spot" />
                  <FooterLink label="DCA" href="/dca" />
                  <FooterLink label="Yield Vaults" href="/yield" />
                  <FooterLink label="Orders" href="/orders" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Resources</h4>
                <div className="space-y-2">
                  <FooterAnchor label="Documentation" href="https://coil-1.gitbook.io/coil-docs" />
                  <FooterAnchor label="Jupiter APIs" href="https://developers.jup.ag" />
                  <FooterAnchor label="GitHub" href="https://github.com/Jobbha/coil.ag" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Community</h4>
                <div className="space-y-2">
                  <FooterAnchor label="Twitter / X" href="https://x.com/coil_ag" />
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">Built With</h4>
                <div className="space-y-2">
                  <FooterAnchor label="Jupiter" href="https://jup.ag" />
                  <FooterAnchor label="Solana" href="https://solana.com" />
                  <FooterAnchor label="Privy" href="https://privy.io" />
                  <FooterAnchor label="Convex" href="https://convex.dev" />
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center justify-between pt-4 border-t border-border-subtle text-xs text-text-dim gap-2">
              <span>2026 Coil — Jupiter Frontier Hackathon</span>
              <span>Non-custodial. Your keys, your funds.</span>
            </div>
          </footer>
        </div>
      </div>
    </AppContext.Provider>
  );
}

function FooterLink({ label, href }: { label: string; href: string }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(href)} className="block text-sm text-text-dim hover:text-mint transition-colors">
      {label}
    </button>
  );
}

function FooterAnchor({ label, href }: { label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block text-sm text-text-dim hover:text-mint transition-colors">
      {label}
    </a>
  );
}
