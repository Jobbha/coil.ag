"use client";

export default function Hero({ onGetStarted }: { onGetStarted?: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-shell to-bg-card p-4 md:p-10">
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-mint/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative">
        {/* Mobile: compact hero */}
        <div className="md:hidden space-y-3">
          <h1 className="text-xl font-bold tracking-tight text-text-primary leading-tight">
            Set a limit order. <span className="text-mint">Earn while you wait.</span>
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed">
            Idle capital earns yield in Jupiter Lend. Auto-triggers your order when price is right.
          </p>
          {onGetStarted && (
            <button
              onClick={onGetStarted}
              className="w-full px-5 py-2.5 rounded-xl bg-mint text-bg-base font-semibold text-sm
                         hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)] animate-mintPulse"
            >
              Pick a token to start
            </button>
          )}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border-subtle">
            <Stat label="APY" value="Variable" sub="Jupiter Lend" />
            <Stat label="Order" value="OTOCO" sub="TP + SL" />
            <Stat label="APIs" value="7" sub="Jupiter" />
          </div>
        </div>

        {/* Desktop: full hero */}
        <div className="hidden md:block">
          <div className="grid grid-cols-2 gap-8 items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-mint/10 border border-mint/20">
                <div className="w-1.5 h-1.5 rounded-full bg-mint animate-pulse" />
                <span className="text-sm font-medium text-mint">Powered by Jupiter</span>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-text-primary leading-tight">
                Set a limit order.
                <br />
                <span className="text-mint">Earn while you wait.</span>
              </h1>
              <p className="text-base text-text-secondary leading-relaxed max-w-md">
                Your capital sits idle in every limit order. Coil changes that — it deposits your USDC into
                Jupiter Lend to earn yield, then auto-triggers your order when the price is right.
              </p>
              <div className="flex items-center gap-3 pt-1">
                {onGetStarted && (
                  <button
                    onClick={onGetStarted}
                    className="px-6 py-2.5 rounded-xl bg-mint text-bg-base font-semibold text-sm
                               hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)] animate-mintPulse"
                  >
                    Pick a token to start
                  </button>
                )}
                <a href="#how-it-works" className="px-5 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:text-text-primary hover:border-mint/30 transition-colors">
                  How it works
                </a>
              </div>
            </div>
            <div className="space-y-3">
              <Step n="1" title="Choose your entry" desc="Pick a token and set the price you want to buy at" icon={<TargetIcon />} />
              <Step n="2" title="Capital earns yield" desc="Your USDC earns yield in Jupiter Lend while waiting" icon={<YieldIcon />} active />
              <Step n="3" title="Auto-triggers at target" desc="When price approaches, Coil withdraws and places your OTOCO order" icon={<BoltIcon />} />
              <Step n="4" title="Profit + bonus yield" desc="Order fills at your price — yield earned during the wait is pure bonus" icon={<SparkleIcon />} />
            </div>
          </div>
          <div id="how-it-works" className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-border-subtle">
            <Stat label="Lending APY" value="Variable" sub="via Jupiter Lend" />
            <Stat label="Order Type" value="OTOCO" sub="Entry + TP + SL in one" />
            <Stat label="APIs Used" value="7" sub="Price, Lend, Trigger, Swap, Tokens, Recurring, Prediction" />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step({ n, title, desc, icon, active }: { n: string; title: string; desc: string; icon: React.ReactNode; active?: boolean }) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
      active ? "border-mint/30 bg-mint/5" : "border-border-subtle bg-bg-inset/50"
    }`}>
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
        active ? "bg-mint text-bg-base" : "bg-bg-card text-text-muted border border-border"
      }`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-dim font-mono">0{n}</span>
          <span className="text-sm font-semibold text-text-primary">{title}</span>
        </div>
        <p className="text-sm text-text-muted mt-0.5">{desc}</p>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-dim uppercase tracking-wider">{label}</p>
      <p className="text-xl font-bold font-mono text-mint mt-1">{value}</p>
      <p className="text-xs text-text-muted mt-0.5">{sub}</p>
    </div>
  );
}

function TargetIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function YieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2v20M2 12h20" /><path d="M17 7l-5 5-5-5" />
    </svg>
  );
}

function BoltIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}
