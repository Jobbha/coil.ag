"use client";

import { type ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";

export default function PrivyAuthProvider({ children }: { children: ReactNode }) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#49E7B2",
          logo: "/coil-logo.png",
        },
        loginMethods: ["email", "google", "wallet"],
      }}
    >
      {children}
    </PrivyProvider>
  );
}
