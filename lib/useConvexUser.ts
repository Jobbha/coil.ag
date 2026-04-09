"use client";

import { useEffect, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallet } from "@solana/wallet-adapter-react";

/**
 * Syncs Privy auth state with Convex user record.
 * Falls back gracefully when Convex is not configured.
 */
export function useConvexUser() {
  const { authenticated, user: privyUser } = usePrivy();
  const { publicKey } = useWallet();
  const synced = useRef(false);
  const [profile, setProfile] = useState<{
    referralCode?: string;
    totalYieldEarned?: number;
    totalOrdersPlaced?: number;
  } | null>(null);

  const privyId = privyUser?.id;
  const wallet = publicKey?.toBase58();
  const email = privyUser?.email?.address ?? privyUser?.google?.email;

  const referredByCode = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("ref") ?? undefined
    : undefined;

  // Sync with Convex when available
  useEffect(() => {
    if (!authenticated || !privyId || synced.current) return;
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) return; // Convex not configured

    synced.current = true;

    // Use fetch to call Convex HTTP endpoint
    fetch(`${convexUrl}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "users:getOrCreate",
        args: { privyId, wallet, email, referredByCode },
      }),
    }).catch(() => {
      synced.current = false;
    });
  }, [authenticated, privyId, wallet, email, referredByCode]);

  useEffect(() => {
    if (!authenticated) synced.current = false;
  }, [authenticated]);

  // For now, referral code stored locally until Convex is connected
  useEffect(() => {
    if (!authenticated) return;
    const stored = localStorage.getItem("coil-referral-code");
    if (stored) {
      setProfile({ referralCode: stored });
    } else {
      const code = generateCode();
      localStorage.setItem("coil-referral-code", code);
      setProfile({ referralCode: code });
    }
  }, [authenticated]);

  return {
    profile,
    referralLink: profile?.referralCode
      ? `${typeof window !== "undefined" ? window.location.origin : ""}?ref=${profile.referralCode}`
      : null,
  };
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
