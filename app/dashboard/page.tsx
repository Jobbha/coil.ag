"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import TopNav from "@/components/TopNav";
import TickerStrip from "@/components/TickerStrip";
import Hero from "@/components/Hero";
import TokenList from "@/components/TokenList";
import SetupForm from "@/components/SetupForm";
import PriceChart from "@/components/PriceChart";
import PositionsPanel from "@/components/PositionsPanel";
import ProfileTab from "@/components/ProfileTab";
import DxNotes from "@/components/DxNotes";
import YieldVaults from "@/components/YieldVaults";
import Portfolio from "@/components/Portfolio";
import PerpsPage from "@/components/PerpsPage";
import DCAPage from "@/components/DCAPage";
import PredictPage from "@/components/PredictPage";
import { useCoilEngine } from "@/lib/useCoilEngine";
import { POPULAR_TOKENS, type TokenListItem } from "@/lib/tokens";

type PriceMap = Record<string, { usdPrice: number; priceChange24h: number }>;

export default function DashboardPage() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();

  // Build a signAndSend function for auto-execution
  const signAndSend = useCallback(
    async (txBase64: string): Promise<string> => {
      if (!signTransaction) throw new Error("Wallet not connected");
      const txBytes = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);
      const sig = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    },
    [signTransaction, connection],
  );

  const { orders, addOrder, removeOrder, updateOrder } = useCoilEngine([], {
    walletAddress: publicKey?.toBase58() ?? null,
    signAndSend: signTransaction ? signAndSend : undefined,
  });
  const [selectedToken, setSelectedToken] = useState<TokenListItem | null>(null);
  const [activeTab, setActiveTab] = useState("Spot");
  const tokenListRef = useRef<HTMLDivElement>(null);
  const [prices, setPrices] = useState<PriceMap>({});
  const [liveTargetPrice, setLiveTargetPrice] = useState<number | null>(null);

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

  function handleTokenSelect(token: TokenListItem) {
    setSelectedToken(token);
    if (!["Spot", "Perps", "DCA"].includes(activeTab)) {
      setActiveTab("Spot");
    }
  }

  function handleOrderSubmit(order: Parameters<typeof addOrder>[0]) {
    addOrder(order);
    // Stay on the same view — positions panel will show the new order
  }

  return (
    <div className="flex-1 flex flex-col items-center py-2 px-2 md:py-4 md:px-4">
      <div className="w-full max-w-[1400px] md:w-[90%] lg:w-[80%] app-shell flex flex-col min-h-[92vh]">
        <TopNav activeTab={activeTab} onTabChange={setActiveTab} />
        <TickerStrip onTokenClick={handleTokenSelect} prices={prices} />

        <div className="flex-1 p-2 md:p-4">
          {activeTab === "Spot" && (
            <div className="space-y-4 animate-fadeIn" key="spot">
              {selectedToken ? (
                <div key={selectedToken.mint} className="animate-fadeIn space-y-4">
                  <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-9">
                      <PriceChart
                        mint={selectedToken.mint}
                        symbol={selectedToken.symbol}
                        spotPrice={selectedToken.usdPrice}
                        priceChange24h={selectedToken.priceChange24h}
                        targetPrice={liveTargetPrice}
                      />
                    </div>
                    <div className="lg:col-span-3">
                      <div className="glass-card p-3 md:p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
                        <SetupForm
                          token={selectedToken}
                          onSubmit={handleOrderSubmit}
                          onBack={() => setSelectedToken(null)}
                          onTargetPriceChange={setLiveTargetPrice}
                        />
                      </div>
                    </div>
                  </div>
                  <PositionsPanel orders={orders} onUpdateOrder={updateOrder} onCancelOrder={removeOrder} />
                </div>
              ) : (
                <div className="animate-fadeIn space-y-4" key="tokenlist">
                  <Hero onGetStarted={() => tokenListRef.current?.scrollIntoView({ behavior: "smooth" })} />
                  <div ref={tokenListRef}>
                    <TokenList onSelect={handleTokenSelect} prices={prices} onPricesUpdate={setPrices} />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "Perps" && (
            <div className="animate-fadeIn" key="perps">
              <PerpsPage prices={prices} onPricesUpdate={setPrices} />
            </div>
          )}

          {activeTab === "DCA" && (
            <div className="animate-fadeIn" key="dca">
              <DCAPage prices={prices} onPricesUpdate={setPrices} onSubmitOrder={addOrder} />
            </div>
          )}

          {activeTab === "Predict" && (
            <div className="animate-fadeIn" key="predict">
              <PredictPage />
            </div>
          )}

          {activeTab === "Orders" && (
            <div className="animate-fadeIn space-y-4">
              <Portfolio orders={orders} />
              <PositionsPanel orders={orders} onUpdateOrder={updateOrder} onCancelOrder={removeOrder} />
            </div>
          )}

          {activeTab === "Yield" && (
            <div className="animate-fadeIn">
              <YieldVaults />
            </div>
          )}

          {activeTab === "Profile" && <ProfileTab />}

          {activeTab === "DX Log" && (
            <div className="space-y-4">
              <DxNotes />
              <div className="glass-card p-4">
                <h3 className="text-sm font-medium text-text-primary mb-2">DX Report Summary</h3>
                <div className="grid grid-cols-3 gap-3">
                  <StatBox label="APIs Used" value="5" sub="Price, Lend, Trigger, Swap, Tokens" />
                  <StatBox label="DX Findings" value="2" sub="#1 Price shape, #2 Lend field names" />
                  <StatBox label="Missing" value="Charts" sub="No historical price endpoint" />
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between px-6 py-3 border-t border-border-subtle text-sm text-text-dim">
          <span>2026 © Coil — Jupiter Frontier Hackathon</span>
          <div className="flex items-center gap-4">
            <span>Built with Jupiter Developer Platform</span>
            <span className="text-mint">developers.jup.ag</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function StatBox({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-bg-inset border border-border-subtle rounded-lg p-3">
      <p className="text-sm text-text-dim uppercase tracking-wider">{label}</p>
      <p className="text-base font-bold font-mono text-text-primary mt-1">{value}</p>
      <p className="text-sm text-text-muted mt-0.5">{sub}</p>
    </div>
  );
}
