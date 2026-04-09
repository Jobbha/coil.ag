"use client";

import { type ReactNode } from "react";
import { ConvexProvider as BaseConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export default function ConvexProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    // Convex not configured — app works without it (localStorage fallback)
    return <>{children}</>;
  }

  return (
    <BaseConvexProvider client={convex}>
      {children}
    </BaseConvexProvider>
  );
}

export { convex };
