"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PriceChart from "@/components/PriceChart";
import SetupForm from "@/components/SetupForm";
import PositionsPanel from "@/components/PositionsPanel";
import { useApp } from "../../layout";
import { POPULAR_TOKENS, type TokenListItem } from "@/lib/tokens";

export default function SpotTokenPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const { orders, handleOrderSubmit, handleOrderCancel, updateOrder, prices } = useApp();
  const [token, setToken] = useState<TokenListItem | null>(null);
  const [liveTargetPrice, setLiveTargetPrice] = useState<number | null>(null);

  useEffect(() => {
    // Try popular tokens first
    const found = POPULAR_TOKENS.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
    if (found) {
      const priceInfo = prices[found.mint];
      setToken({ ...found, usdPrice: priceInfo?.usdPrice ?? found.usdPrice, priceChange24h: priceInfo?.priceChange24h ?? 0 });
      return;
    }
    // Fetch from API
    fetch(`/api/tokens?query=${symbol}`)
      .then((r) => r.json())
      .then((data) => {
        const t = data.tokens?.[0];
        if (t) setToken({ ...t, usdPrice: t.usdPrice ?? 0, priceChange24h: 0 });
      })
      .catch(() => {});
  }, [symbol, prices]);

  if (!token) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-5 h-5 border-2 border-mint/30 border-t-mint rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9">
          <PriceChart
            mint={token.mint}
            symbol={token.symbol}
            spotPrice={token.usdPrice}
            priceChange24h={token.priceChange24h}
            targetPrice={liveTargetPrice}
          />
        </div>
        <div className="lg:col-span-3">
          <div className="glass-card p-3 md:p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
            <SetupForm
              token={token}
              onSubmit={handleOrderSubmit}
              onBack={() => window.history.back()}
              onTargetPriceChange={setLiveTargetPrice}
            />
          </div>
        </div>
      </div>
      <PositionsPanel orders={orders} onUpdateOrder={updateOrder} onCancelOrder={handleOrderCancel} />
    </div>
  );
}
