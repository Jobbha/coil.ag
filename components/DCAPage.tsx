"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { VersionedTransaction } from "@solana/web3.js";
import type { TokenListItem } from "@/lib/tokens";
import type { CoilOrder } from "@/lib/coilEngine";
import { createOrder, KNOWN_MINTS } from "@/lib/coilEngine";
import { getJlToken } from "@/lib/jlTokens";
import TokenList from "./TokenList";
import PriceChart from "./PriceChart";
import YieldPicker from "./YieldPicker";

type PriceMap = Record<string, { usdPrice: number; priceChange24h: number }>;

interface Props {
  prices: PriceMap;
  onPricesUpdate: (fn: (prev: PriceMap) => PriceMap) => void;
  onSubmitOrder?: (order: CoilOrder) => void;
}

const INTERVAL_MS: Record<string, number> = {
  "1h": 3_600_000,
  "4h": 14_400_000,
  "1d": 86_400_000,
  "1w": 604_800_000,
};

export default function DCAPage({ prices, onPricesUpdate, onSubmitOrder }: Props) {
  const { publicKey, signTransaction, connected } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();

  const [token, setToken] = useState<TokenListItem | null>(null);
  const [capital, setCapital] = useState("500");
  const [slices, setSlices] = useState("10");
  const [interval, setInterval_] = useState("1d");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yieldVault, setYieldVault] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [txStatus, setTxStatus] = useState("");

  const capitalNum = parseFloat(capital) || 0;
  const sliceNum = parseInt(slices) || 1;
  const perSlice = capitalNum / sliceNum;
  const spotPrice = token?.usdPrice ?? 0;

  const intervalHours: Record<string, number> = { "1h": 1, "4h": 4, "1d": 24, "1w": 168 };
  const totalHours = sliceNum * (intervalHours[interval] ?? 24);
  const durationLabel = totalHours < 24 ? `${totalHours}h` : totalHours < 168 ? `${(totalHours / 24).toFixed(0)}d` : `${(totalHours / 168).toFixed(1)}w`;

  async function handleSubmit() {
    if (!connected || !publicKey || !signTransaction) {
      setVisible(true);
      return;
    }
    if (!token || !onSubmitOrder) return;

    setSubmitting(true);
    setTxStatus("Building deposit...");

    try {
      const assetMint = KNOWN_MINTS.USDC;
      const amount = Math.floor(capitalNum * 1e6).toString();

      // Deposit all capital to Lend upfront
      const res = await fetch("/api/lend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "deposit", asset: assetMint, amount, signer: publicKey.toBase58() }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to build deposit");
      }

      const { transaction: txBase64 } = await res.json();

      setTxStatus("Sign in wallet...");
      const txBytes = Buffer.from(txBase64, "base64");
      const tx = VersionedTransaction.deserialize(txBytes);
      const signed = await signTransaction(tx);

      setTxStatus("Sending...");
      const sig = await connection.sendRawTransaction(signed.serialize(), { skipPreflight: false, maxRetries: 3 });

      setTxStatus("Confirming...");
      await connection.confirmTransaction(sig, "confirmed");

      // Create DCA order — engine will execute slices on schedule
      const jlToken = getJlToken(assetMint);
      const sliceAmount = Math.floor(capitalNum / sliceNum * 1e6).toString();

      const order = createOrder({
        inputMint: assetMint,
        outputMint: token.mint,
        targetPrice: spotPrice,
        takeProfitPrice: 0,
        stopLossPrice: 0,
        capitalAmount: amount,
        proximityThreshold: 1, // always execute (DCA doesn't wait for price)
        yieldMint: jlToken?.jlMint ?? null,
        yieldSymbol: jlToken?.jlSymbol ?? null,
        strategy: "dca",
      });
      order.lendTxSignature = sig;
      order.dcaSliceCount = sliceNum;
      order.dcaSliceInterval = INTERVAL_MS[interval] ?? 86_400_000;
      order.dcaSlicesExecuted = 0;
      order.dcaLastSliceAt = Date.now();

      onSubmitOrder(order);
      setTxStatus("");
      setToken(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      setTxStatus(msg.includes("rejected") ? "Cancelled" : msg.slice(0, 60));
      setTimeout(() => setTxStatus(""), 5000);
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="animate-fadeIn space-y-4">
        <div className="glass-card p-3 md:p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-mint/10 border border-mint/20 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-mint">
                <path d="M2 14V6M6 14V4M10 14V8M14 14V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-text-primary">DCA Coil</h2>
              <p className="text-xs text-text-dim">Dollar-cost average with yield between slices — deposit all upfront to Lend, swap out in slices</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">How it works</p>
              <p className="text-sm font-semibold text-text-primary mt-1">Lend → Swap slices</p>
            </div>
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">Idle capital earns</p>
              <p className="text-sm font-semibold text-mint mt-1">~3-8% APY</p>
            </div>
            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle">
              <p className="text-xs text-text-dim uppercase tracking-wider">Powered by</p>
              <p className="text-sm font-semibold text-text-primary mt-1">Jupiter Lend + Swap</p>
            </div>
          </div>
        </div>
        <TokenList onSelect={setToken} prices={prices} onPricesUpdate={onPricesUpdate} />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-9">
          <PriceChart mint={token.mint} symbol={token.symbol} spotPrice={token.usdPrice} priceChange24h={token.priceChange24h} />
        </div>
        <div className="lg:col-span-3">
          <div className="glass-card p-4 max-h-[calc(100vh-180px)] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button onClick={() => setToken(null)} className="w-6 h-6 rounded-md bg-bg-inset border border-border flex items-center justify-center text-text-muted hover:text-text-primary text-sm">←</button>
                <span className="text-sm font-semibold text-text-primary">${token.symbol} DCA</span>
              </div>
              <span className="text-xs text-mint font-mono">Yield on idle</span>
            </div>

            <div className="bg-bg-inset rounded-lg p-3 border border-border">
              <span className="text-sm text-text-muted block mb-1">Total to deploy</span>
              <div className="flex items-center gap-2">
                <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
                  className="input-inline flex-1 min-w-0 text-base font-mono font-semibold text-text-primary" />
                <span className="text-sm text-text-muted">USDC</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Slices</span>
              <input type="number" min="2" max="100" value={slices} onChange={(e) => setSlices(e.target.value)}
                className="w-16 text-center bg-bg-inset border border-border rounded-md px-2 py-1 text-sm font-mono" />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">Every</span>
              <div className="flex gap-1">
                {["1h", "4h", "1d", "1w"].map((iv) => (
                  <button key={iv} type="button" onClick={() => setInterval_(iv)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      interval === iv ? "bg-mint text-bg-base" : "text-text-muted bg-bg-inset border border-border"
                    }`}>
                    {iv}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-sm text-text-muted block mb-1">Price range (optional)</span>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" step="any" placeholder="Min" value={priceMin} onChange={(e) => setPriceMin(e.target.value)}
                  className="bg-bg-inset border border-border rounded-md px-2 py-1.5 text-sm font-mono text-text-primary" />
                <input type="number" step="any" placeholder="Max" value={priceMax} onChange={(e) => setPriceMax(e.target.value)}
                  className="bg-bg-inset border border-border rounded-md px-2 py-1.5 text-sm font-mono text-text-primary" />
              </div>
            </div>

            <div className="bg-bg-inset rounded-lg p-3 border border-border-subtle space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-text-dim">Per slice</span>
                <span className="text-text-primary font-mono">${perSlice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Duration</span>
                <span className="text-text-primary font-mono">{durationLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-dim">Yield while waiting</span>
                <span className="text-mint font-mono">~${((capitalNum / 2) * 0.05 / 365 * (totalHours / 24)).toFixed(4)}</span>
              </div>
            </div>

            <YieldPicker selected={yieldVault} onSelect={setYieldVault} />

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`w-full py-2.5 rounded-lg font-semibold text-sm uppercase tracking-wide transition-all ${
                submitting
                  ? "bg-bg-inset border border-border text-text-muted cursor-wait"
                  : "bg-mint text-bg-base hover:bg-mint-dark shadow-[0_0_16px_rgba(73,231,178,0.15)] animate-mintPulse"
              }`}
            >
              {submitting ? txStatus : !connected ? "Connect Wallet" : `Start DCA Coil — $${token.symbol}`}
            </button>

            {txStatus && !submitting && (
              <p className={`text-center text-sm ${txStatus === "Cancelled" ? "text-text-dim" : "text-red"}`}>{txStatus}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
