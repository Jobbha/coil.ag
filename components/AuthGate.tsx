"use client";

import { usePrivy } from "@privy-io/react-auth";
import Image from "next/image";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 animate-fadeIn">
          <Image src="/coil-logo.png" alt="Coil" width={120} height={48} priority />
          <div className="w-6 h-6 border-2 border-mint border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="glass-card p-8 md:p-12 max-w-md w-full text-center animate-fadeIn">
          <Image
            src="/coil-logo.png"
            alt="Coil"
            width={140}
            height={56}
            className="mx-auto mb-6"
            priority
          />

          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Earn While You Wait
          </h1>
          <p className="text-sm text-text-muted mb-8">
            Put idle limit-order capital to work. Earn yield via Jupiter Lend while waiting for your target price.
          </p>

          <button
            onClick={() => login()}
            className="w-full px-6 py-3 rounded-xl bg-mint text-white dark:text-bg-base text-sm font-semibold uppercase tracking-wide
                       hover:bg-mint-dark transition-colors shadow-[0_0_20px_var(--mint-glow)]"
          >
            Sign Up / Log In
          </button>

          <p className="text-xs text-text-dim mt-6">
            Powered by Privy — sign in with email, Google, or wallet
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
