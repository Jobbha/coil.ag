"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import Hero from "@/components/Hero";
import TokenList from "@/components/TokenList";
import { useApp } from "../layout";

export default function SpotPage() {
  const { prices, setPrices } = useApp();
  const router = useRouter();
  const tokenListRef = useRef<HTMLDivElement>(null);

  return (
    <div className="animate-fadeIn space-y-4">
      <Hero onGetStarted={() => tokenListRef.current?.scrollIntoView({ behavior: "smooth" })} />
      <div ref={tokenListRef}>
        <TokenList
          onSelect={(token) => router.push(`/spot/${token.symbol}`)}
          prices={prices}
          onPricesUpdate={setPrices}
        />
      </div>
    </div>
  );
}
