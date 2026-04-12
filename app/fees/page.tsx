import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coil Fees: 0.1% Swap, No Hidden Costs",
  description:
    "Coil charges 0.1% swap fee on execution and 8% on earned yield only. No deposit, withdrawal, or subscription fees. Transparent DeFi pricing.",
  alternates: { canonical: "/fees" },
};

export default function FeesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border-subtle bg-bg-base/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-text-primary">
            <img src="/coil-icon.png" alt="Coil" className="h-6 w-6" />
            Coil
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/how-it-works" className="hover:text-text-primary transition-colors">How It Works</Link>
            <Link href="/fees" className="text-text-primary">Fees</Link>
            <Link href="/points" className="hover:text-text-primary transition-colors">Points</Link>
            <a href="https://coil-1.gitbook.io/coil-docs" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>
          <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-mint text-bg-base font-semibold text-sm hover:bg-mint-dark transition-colors">Launch App</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          Simple, Transparent Fees
        </h1>
        <p className="text-lg text-text-secondary mb-12">
          No hidden costs. You only pay when you trade or earn yield.
        </p>

        {/* Fee table */}
        <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden mb-12">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Fee Type</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary">Amount</th>
                <th className="px-6 py-4 text-sm font-semibold text-text-primary hidden md:table-cell">Details</th>
              </tr>
            </thead>
            <tbody className="text-sm text-text-secondary">
              <tr className="border-b border-border-subtle">
                <td className="px-6 py-4 font-medium text-text-primary">Swap Fee</td>
                <td className="px-6 py-4 font-mono text-mint">0.1%</td>
                <td className="px-6 py-4 hidden md:table-cell">Charged on execution via Jupiter platformFeeBps</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-6 py-4 font-medium text-text-primary">Yield Performance Fee</td>
                <td className="px-6 py-4 font-mono text-mint">8%</td>
                <td className="px-6 py-4 hidden md:table-cell">On earned yield only — never on your principal</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-6 py-4 font-medium text-text-primary">Deposit Fee</td>
                <td className="px-6 py-4 font-mono text-mint">0%</td>
                <td className="px-6 py-4 hidden md:table-cell">Free to deposit</td>
              </tr>
              <tr className="border-b border-border-subtle">
                <td className="px-6 py-4 font-medium text-text-primary">Withdrawal Fee</td>
                <td className="px-6 py-4 font-mono text-mint">0%</td>
                <td className="px-6 py-4 hidden md:table-cell">Free to withdraw anytime</td>
              </tr>
              <tr>
                <td className="px-6 py-4 font-medium text-text-primary">Subscription</td>
                <td className="px-6 py-4 font-mono text-mint">0%</td>
                <td className="px-6 py-4 hidden md:table-cell">No monthly or annual fees</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Example */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-4">Example</h2>
          <div className="rounded-xl border border-border-subtle bg-bg-card p-6 text-text-secondary text-sm space-y-3">
            <p>You place a $10,000 USDC limit order that waits 14 days at 5% APY:</p>
            <ul className="space-y-1 ml-4">
              <li>Yield earned: <span className="text-mint font-mono font-semibold">$19.18</span></li>
              <li>Performance fee (8% of yield): <span className="font-mono">$1.53</span></li>
              <li>Swap fee (0.1% of $10,019.18): <span className="font-mono">$10.02</span></li>
              <li>Net yield to you: <span className="text-mint font-mono font-semibold">$17.65</span></li>
            </ul>
            <p className="text-text-dim">Without Coil, you&apos;d earn $0 while waiting. With Coil, you earn $17.65 for free.</p>
          </div>
        </section>

        {/* No hidden fees */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-4">What You Don&apos;t Pay</h2>
          <ul className="space-y-3 text-text-secondary">
            <li className="flex gap-3 items-center">
              <span className="text-mint font-bold">&#10003;</span>
              No deposit fees
            </li>
            <li className="flex gap-3 items-center">
              <span className="text-mint font-bold">&#10003;</span>
              No withdrawal fees
            </li>
            <li className="flex gap-3 items-center">
              <span className="text-mint font-bold">&#10003;</span>
              No subscription or monthly fees
            </li>
            <li className="flex gap-3 items-center">
              <span className="text-mint font-bold">&#10003;</span>
              No fees on your principal — only on earned yield
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
