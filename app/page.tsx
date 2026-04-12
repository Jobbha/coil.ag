import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-border-subtle bg-bg-base/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center">
            <img src="/coil-logo.png" alt="Coil" className="h-10 md:h-12 object-contain" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/how-it-works" className="hover:text-text-primary transition-colors">How It Works</Link>
            <Link href="/fees" className="hover:text-text-primary transition-colors">Fees</Link>
            <Link href="/points" className="hover:text-text-primary transition-colors">Points</Link>
            <a href="https://coil-1.gitbook.io/coil-docs" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>
          <Link
            href="/dashboard"
            className="px-5 py-2 rounded-xl bg-mint text-bg-base font-semibold text-sm hover:bg-mint-dark transition-colors"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
            <span className="text-sm font-medium text-mint">Built on Jupiter</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-text-primary leading-tight mb-4">
            Earn yield on idle limit orders.{" "}
            <span className="text-mint">Automatically.</span>
          </h1>

          <p className="text-base md:text-lg text-text-secondary max-w-2xl mx-auto mb-8">
            Every limit order you place earns 3-8% APY via Jupiter Lend while waiting for your target price.
            When it hits, Coil auto-executes. Non-custodial. Zero idle time.
          </p>

          <div className="flex items-center justify-center gap-4 mb-12">
            <Link
              href="/dashboard"
              className="px-8 py-3 rounded-xl bg-mint text-bg-base font-semibold text-sm uppercase tracking-wide hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)]"
            >
              Start Earning
            </Link>
            <Link
              href="/how-it-works"
              className="px-8 py-3 rounded-xl border border-border-subtle text-text-secondary font-semibold text-sm uppercase tracking-wide hover:text-text-primary hover:border-text-secondary transition-colors"
            >
              How It Works
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 md:gap-12">
            <div>
              <p className="text-2xl md:text-3xl font-bold font-mono text-mint">3-8%</p>
              <p className="text-xs text-text-dim mt-1">Variable APY</p>
            </div>
            <div className="w-px h-10 bg-border-subtle" />
            <div>
              <p className="text-2xl md:text-3xl font-bold font-mono text-text-primary">OTOCO</p>
              <p className="text-xs text-text-dim mt-1">Entry + TP + SL</p>
            </div>
            <div className="w-px h-10 bg-border-subtle" />
            <div>
              <p className="text-2xl md:text-3xl font-bold font-mono text-text-primary">24/7</p>
              <p className="text-xs text-text-dim mt-1">Auto-execution</p>
            </div>
            <div className="w-px h-10 bg-border-subtle" />
            <div>
              <p className="text-2xl md:text-3xl font-bold font-mono text-text-primary">0%</p>
              <p className="text-xs text-text-dim mt-1">Liquidation risk</p>
            </div>
          </div>
        </section>

        {/* How it works preview */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <Link href="/how-it-works" className="block text-center">
            <h2 className="text-2xl font-bold text-text-primary mb-2">How Coil Earns Yield on Limit Orders</h2>
            <p className="text-sm text-text-secondary mb-8">Learn how yield-bearing limit orders work on Solana →</p>
          </Link>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold text-lg mb-4">1</div>
              <h3 className="font-semibold text-text-primary mb-2">Place a Limit Order</h3>
              <p className="text-sm text-text-secondary">Choose your token, set your target price. OTOCO support for entry + take-profit + stop-loss.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold text-lg mb-4">2</div>
              <h3 className="font-semibold text-text-primary mb-2">Earn Yield While Waiting</h3>
              <p className="text-sm text-text-secondary">Capital is deposited into Jupiter Lend. You earn 3-8% variable APY via jlTokens. Non-custodial.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <div className="w-10 h-10 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold text-lg mb-4">3</div>
              <h3 className="font-semibold text-text-primary mb-2">Auto-Execute at Target</h3>
              <p className="text-sm text-text-secondary">When price hits, jlToken redemption + swap happen in one atomic transaction. Zero idle time.</p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-text-primary text-center mb-8">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <h3 className="font-semibold text-mint mb-2">Yield-Bearing Limit Orders</h3>
              <p className="text-sm text-text-secondary">Every limit order earns variable APY. Your capital is never idle — it works for you from the moment you place an order until execution.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <h3 className="font-semibold text-mint mb-2">DCA with Yield</h3>
              <p className="text-sm text-text-secondary">Dollar-cost average with all capital earning yield upfront. Remaining capital continues earning as slices execute. Compound toggle available.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <h3 className="font-semibold text-mint mb-2">Multi-Vault Support</h3>
              <p className="text-sm text-text-secondary">USDC, USDG, JupUSD, SOL, and USDT vaults. Auto-swap from USDC into the correct vault for maximum yield.</p>
            </div>
            <div className="rounded-xl border border-border-subtle bg-bg-card p-6">
              <h3 className="font-semibold text-mint mb-2">Non-Custodial & Secure</h3>
              <p className="text-sm text-text-secondary">Funds go directly to Jupiter Lend, never held by Coil. Supply-only lending means zero liquidation risk. Uses Jupiter&apos;s audited programs.</p>
            </div>
          </div>
        </section>

        {/* Supported tokens */}
        <section className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-text-primary mb-4">Supported Tokens</h2>
          <p className="text-text-secondary mb-6">Trade and earn yield on popular Solana tokens</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {["SOL", "USDC", "USDG", "JupUSD", "USDT", "JUP", "BONK", "RAY", "ETH", "mSOL", "JTO", "WEN", "PYTH", "RNDR"].map((t) => (
              <Link key={t} href={`/spot/${t}`} className="px-3 py-1.5 rounded-lg bg-bg-card border border-border-subtle text-sm font-mono text-text-secondary hover:border-mint/30 hover:text-mint transition-colors">{t}</Link>
            ))}
          </div>
        </section>

        {/* Internal links for SEO */}
        <section className="max-w-4xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/how-it-works" className="rounded-xl border border-border-subtle bg-bg-card p-5 hover:border-mint/30 transition-colors group">
              <h3 className="font-semibold text-text-primary group-hover:text-mint transition-colors mb-1">How yield on limit orders works</h3>
              <p className="text-xs text-text-secondary">Learn how Coil earns 3-8% APY on idle limit order capital via Jupiter Lend →</p>
            </Link>
            <Link href="/fees" className="rounded-xl border border-border-subtle bg-bg-card p-5 hover:border-mint/30 transition-colors group">
              <h3 className="font-semibold text-text-primary group-hover:text-mint transition-colors mb-1">Transparent fee structure</h3>
              <p className="text-xs text-text-secondary">0.1% swap fee, 8% yield performance fee. No hidden costs, no subscriptions →</p>
            </Link>
            <Link href="/points" className="rounded-xl border border-border-subtle bg-bg-card p-5 hover:border-mint/30 transition-colors group">
              <h3 className="font-semibold text-text-primary group-hover:text-mint transition-colors mb-1">Earn Coils points & referrals</h3>
              <p className="text-xs text-text-secondary">100 points for your first order, 50 per referral. Start earning rewards →</p>
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-4">Stop leaving money on the table.</h2>
          <p className="text-text-secondary mb-8">Your limit orders should earn yield on Solana. Start using Coil today.</p>
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-mint text-bg-base font-semibold text-sm uppercase tracking-wide hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)]"
          >
            Launch App
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-bg-base/80">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <div>
              <h4 className="font-semibold text-text-primary mb-3 text-sm">Product</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/dashboard" className="hover:text-text-primary">Launch App</Link></li>
                <li><Link href="/how-it-works" className="hover:text-text-primary">How It Works</Link></li>
                <li><Link href="/fees" className="hover:text-text-primary">Fees</Link></li>
                <li><Link href="/points" className="hover:text-text-primary">Points</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-3 text-sm">Resources</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="https://coil-1.gitbook.io/coil-docs" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">Documentation</a></li>
                <li><a href="/llms.txt" className="hover:text-text-primary">llms.txt</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-3 text-sm">Community</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><a href="https://x.com/coil_ag" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary">Twitter/X</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-text-primary mb-3 text-sm">Built On</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><span>Jupiter</span></li>
                <li><span>Solana</span></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border-subtle pt-6 text-center text-xs text-text-dim">
            &copy; {new Date().getFullYear()} Coil. Built for the Jupiter Frontier Hackathon.
          </div>
        </div>
      </footer>
    </div>
  );
}
