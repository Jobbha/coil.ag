import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
        { key: "X-XSS-Protection", value: "1; mode=block" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://auth.privy.io; connect-src 'self' https://api.jup.ag https://*.helius-rpc.com https://api.geckoterminal.com https://auth.privy.io https://*.privy.io wss://*.privy.io; img-src 'self' https: data:; style-src 'self' 'unsafe-inline'; frame-src https://auth.privy.io https://*.privy.io;" },
      ],
    }];
  },
};

export default nextConfig;
