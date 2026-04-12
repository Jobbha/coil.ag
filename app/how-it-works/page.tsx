import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How Coil Works: Earn 3-8% APY on Waiting Orders",
  description:
    "Your limit order capital earns yield via Jupiter Lend on Solana. When your target price hits, Coil auto-executes in one atomic transaction. Non-custodial.",
  alternates: { canonical: "/how-it-works" },
};

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-subtle bg-bg-base/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-text-primary">
            <img src="/coil-icon.png" alt="Coil" className="h-6 w-6" />
            Coil
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/how-it-works" className="text-text-primary">How It Works</Link>
            <Link href="/fees" className="hover:text-text-primary transition-colors">Fees</Link>
            <Link href="/points" className="hover:text-text-primary transition-colors">Points</Link>
            <a href="https://coil-1.gitbook.io/coil-docs" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>
          <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-mint text-bg-base font-semibold text-sm hover:bg-mint-dark transition-colors">Launch App</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          How Coil Earns Yield on Your Limit Orders
        </h1>
        <p className="text-lg text-text-secondary mb-12">
          Coil turns idle limit order capital into yield-generating positions on Solana. Here&apos;s exactly how it works.
        </p>

        {/* The Problem */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-3">The Problem: Idle Capital</h2>
          <p className="text-text-secondary mb-4">
            Every time you place a limit order — on any exchange — your capital sits idle earning 0% while waiting for the price to hit. A $50,000 order waiting 2 weeks means potentially $100+ in lost yield. Across the crypto market, billions of dollars sit idle in limit orders every day.
          </p>
        </section>

        {/* The Solution */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-3">The Solution: Yield While You Wait</h2>
          <p className="text-text-secondary mb-6">
            Coil automatically deposits your capital into Jupiter Lend the moment you place an order. Your money earns 3-8% variable APY via jlTokens (yield-bearing receipt tokens) while waiting for your target price.
          </p>

          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">1</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Place Your Order</h3>
                <p className="text-sm text-text-secondary">Choose a token, set your target price, and optionally add take-profit and stop-loss levels (OTOCO). Your capital is deposited into Jupiter Lend.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">2</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Earn Yield via Jupiter Lend</h3>
                <p className="text-sm text-text-secondary">Jupiter Lend issues jlTokens — yield-bearing receipt tokens that appreciate in value as interest accrues. Your capital earns 3-8% variable APY, 24/7.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">3</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Auto-Execute at Target Price</h3>
                <p className="text-sm text-text-secondary">When the spot price hits your target, Jupiter Swap V2 natively routes through the jlToken. The Lend redemption and token swap happen in one atomic transaction. Zero idle time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Innovation */}
        <section className="mb-12 rounded-xl border border-mint/20 bg-mint/5 p-6">
          <h2 className="text-xl font-bold text-mint mb-3">The Key Innovation</h2>
          <p className="text-text-secondary">
            Jupiter Swap V2 natively routes through jlTokens, meaning the Lend redemption and token swap happen in one atomic transaction. Your money earns yield until the <strong className="text-text-primary">exact last second</strong> before execution. No other platform does this.
          </p>
        </section>

        {/* Order Types */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-6">Order Types</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
              <h3 className="font-semibold text-mint mb-2">Limit Orders</h3>
              <p className="text-sm text-text-secondary">Set a target price. Earn yield while waiting. Auto-execute when price hits.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
              <h3 className="font-semibold text-mint mb-2">OTOCO Orders</h3>
              <p className="text-sm text-text-secondary">Entry + Take Profit + Stop Loss in one order. Via Jupiter Trigger for 24/7 execution.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
              <h3 className="font-semibold text-mint mb-2">DCA with Yield</h3>
              <p className="text-sm text-text-secondary">Deposit all capital upfront. Earn yield on the full amount while slices execute over time.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-5">
              <h3 className="font-semibold text-mint mb-2">Compound Yield</h3>
              <p className="text-sm text-text-secondary">Toggle to add earned yield to your buy size for more purchasing power at execution.</p>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-3">Security & Trust</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex gap-3 items-start">
              <span className="text-mint font-bold">&#10003;</span>
              <span><strong className="text-text-primary">Non-custodial</strong> — Funds go directly to Jupiter Lend, never held by Coil</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-mint font-bold">&#10003;</span>
              <span><strong className="text-text-primary">Zero liquidation risk</strong> — Supply-only lending, no borrowing</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-mint font-bold">&#10003;</span>
              <span><strong className="text-text-primary">Your wallet, your keys</strong> — All transactions signed by your own wallet</span>
            </li>
            <li className="flex gap-3 items-start">
              <span className="text-mint font-bold">&#10003;</span>
              <span><strong className="text-text-primary">Audited programs</strong> — No custom smart contracts, uses Jupiter&apos;s audited programs</span>
            </li>
          </ul>
        </section>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-mint text-bg-base font-semibold text-sm uppercase tracking-wide hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)]"
          >
            Start Earning
          </Link>
        </div>
      </main>

      <footer className="border-t border-border-subtle bg-bg-base/80 py-6 text-center text-xs text-text-dim">
        &copy; {new Date().getFullYear()} Coil. Built for the Jupiter Frontier Hackathon.
      </footer>
    </div>
  );
}
