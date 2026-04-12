import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Coil Points & Referrals: Earn on Every Trade",
  description:
    "Earn Coils points for every order, referral, and dollar of yield earned. 100 Coils for your first order, 50 per referral. Start earning today.",
  alternates: { canonical: "/points" },
};

export default function PointsPage() {
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
            <Link href="/fees" className="hover:text-text-primary transition-colors">Fees</Link>
            <Link href="/points" className="text-text-primary">Points</Link>
            <a href="https://coil-1.gitbook.io/coil-docs" target="_blank" rel="noopener noreferrer" className="hover:text-text-primary transition-colors">Docs</a>
          </nav>
          <Link href="/dashboard" className="px-5 py-2 rounded-xl bg-mint text-bg-base font-semibold text-sm hover:bg-mint-dark transition-colors">Launch App</Link>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-12 md:py-20">
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
          Coil Points
        </h1>
        <p className="text-lg text-text-secondary mb-12">
          Earn Coils for trading, earning yield, and referring friends.
        </p>

        {/* Points table */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-4">How to Earn Coils</h2>
          <div className="rounded-xl border border-border-subtle bg-bg-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border-subtle">
                  <th className="px-6 py-4 text-sm font-semibold text-text-primary">Action</th>
                  <th className="px-6 py-4 text-sm font-semibold text-text-primary">Coils Earned</th>
                </tr>
              </thead>
              <tbody className="text-sm text-text-secondary">
                <tr className="border-b border-border-subtle">
                  <td className="px-6 py-4">First order placed</td>
                  <td className="px-6 py-4 font-mono text-mint font-semibold">100 Coils</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="px-6 py-4">Each subsequent order</td>
                  <td className="px-6 py-4 font-mono text-mint font-semibold">25 Coils</td>
                </tr>
                <tr className="border-b border-border-subtle">
                  <td className="px-6 py-4">Successful referral</td>
                  <td className="px-6 py-4 font-mono text-mint font-semibold">50 Coils</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">Per $1 yield earned</td>
                  <td className="px-6 py-4 font-mono text-mint font-semibold">10 Coils</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Referral System */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-text-primary mb-4">Referral Program</h2>
          <div className="space-y-4 text-text-secondary">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">1</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Get Your Code</h3>
                <p className="text-sm">Every Coil user gets a unique referral code in their profile.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">2</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Share Your Link</h3>
                <p className="text-sm">Share <span className="font-mono text-mint">coil.ag?ref=YOUR_CODE</span> with friends and followers.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 shrink-0 rounded-lg bg-mint/10 flex items-center justify-center text-mint font-bold">3</div>
              <div>
                <h3 className="font-semibold text-text-primary mb-1">Earn 50 Coils per Signup</h3>
                <p className="text-sm">When someone signs up through your link, you earn 50 Coils. No limit on referrals.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Example */}
        <section className="mb-12 rounded-xl border border-mint/20 bg-mint/5 p-6">
          <h2 className="text-lg font-bold text-mint mb-3">Example: How Fast Can You Earn?</h2>
          <div className="text-sm text-text-secondary space-y-2">
            <p>Place your first order: <span className="text-mint font-mono font-semibold">+100 Coils</span></p>
            <p>Earn $50 in yield: <span className="text-mint font-mono font-semibold">+500 Coils</span></p>
            <p>Refer 3 friends: <span className="text-mint font-mono font-semibold">+150 Coils</span></p>
            <p>Place 4 more orders: <span className="text-mint font-mono font-semibold">+100 Coils</span></p>
            <p className="pt-2 border-t border-mint/20 font-semibold text-text-primary">Total: 850 Coils</p>
          </div>
        </section>

        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block px-8 py-3 rounded-xl bg-mint text-bg-base font-semibold text-sm uppercase tracking-wide hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)]"
          >
            Start Earning Coils
          </Link>
        </div>
      </main>

      <footer className="border-t border-border-subtle bg-bg-base/80 py-6 text-center text-xs text-text-dim">
        &copy; {new Date().getFullYear()} Coil. Built for the Jupiter Frontier Hackathon.
      </footer>
    </div>
  );
}
