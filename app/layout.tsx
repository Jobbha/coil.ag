import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import ConvexProvider from "@/components/ConvexProvider";
import PrivyAuthProvider from "@/components/PrivyAuthProvider";
import WalletProvider from "@/components/WalletProvider";
import WalletAutoConnect from "@/components/WalletAutoConnect";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://coil.ag"),
  alternates: { canonical: "/" },
  title: {
    default: "Coil — Earn Yield on Idle Limit Orders | Solana DeFi",
    template: "%s | Coil",
  },
  description:
    "Earn 3-8% APY on idle limit order capital via Jupiter Lend on Solana. Non-custodial — your funds earn yield until the exact moment your order executes.",
  keywords: [
    "earn yield limit orders",
    "solana defi yield",
    "jupiter lend",
    "idle capital defi",
    "non-custodial yield solana",
    "solana limit order yield",
    "defi limit orders",
    "crypto limit order platform",
    "earn while waiting crypto",
    "jlToken",
    "OTOCO orders solana",
    "coil defi",
  ],
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
    other: [{ rel: "manifest", url: "/manifest.json" }],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://coil.ag",
    siteName: "Coil",
    title: "Coil — Earn Yield on Idle Limit Orders | Solana DeFi",
    description:
      "Earn 3-8% APY on idle limit order capital via Jupiter Lend on Solana. Non-custodial — your funds earn yield until the exact moment your order executes.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Coil — Earn Yield on Idle Limit Orders" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@coil_ag",
    creator: "@coil_ag",
    title: "Coil — Earn Yield on Idle Limit Orders | Solana DeFi",
    description:
      "Earn 3-8% APY on idle limit order capital via Jupiter Lend. Non-custodial, auto-executing, zero idle time.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-G8QYBRCGJ8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-G8QYBRCGJ8');`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Coil",
              url: "https://coil.ag",
              logo: "https://coil.ag/coil-logo.png",
              sameAs: ["https://x.com/coil_ag"],
              description:
                "Non-custodial DeFi platform on Solana that earns yield on idle limit order capital via Jupiter Lend.",
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Coil",
              url: "https://coil.ag",
              applicationCategory: "DeFi",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free to use. 0.1% swap fee on execution, 8% performance fee on earned yield only.",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: [
                {
                  "@type": "Question",
                  name: "What is Coil?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Coil is a non-custodial DeFi platform on Solana that earns yield on idle limit order capital. When you place a limit order, your capital is deposited into Jupiter Lend to earn 3-8% variable APY. When the target price hits, Coil auto-executes — swapping the yield-bearing jlToken into your target token in a single atomic transaction.",
                  },
                },
                {
                  "@type": "Question",
                  name: "How does Coil earn yield on limit orders?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "When you place an order on Coil, your capital is deposited into Jupiter Lend, which issues jlTokens (yield-bearing receipt tokens). These jlTokens earn variable APY. When the spot price reaches your target, Jupiter Swap V2 natively routes through jlTokens — so the Lend redemption and token swap happen in one atomic transaction. Your money earns yield until the exact last second before execution.",
                  },
                },
                {
                  "@type": "Question",
                  name: "Is Coil safe and non-custodial?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Yes. Coil is fully non-custodial — funds go directly to Jupiter Lend, never held by Coil. All transactions are signed by your own wallet. Coil uses supply-only lending (no borrowing), so there is zero liquidation risk. No custom smart contracts are deployed — Coil uses Jupiter's audited programs.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What fees does Coil charge?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Coil charges a 0.1% swap fee on execution and an 8% performance fee on earned yield only (not on your principal). There are no deposit fees, no withdrawal fees, and no subscription fees.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What tokens does Coil support?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "Coil supports multiple Solana tokens including SOL, USDC, USDG, JupUSD, USDT, JUP, BONK, RAY, ETH, mSOL, JTO, WEN, PYTH, and RNDR. Multi-vault support includes USDC, USDG, JupUSD, SOL, and USDT vaults.",
                  },
                },
                {
                  "@type": "Question",
                  name: "What are OTOCO orders on Coil?",
                  acceptedAnswer: {
                    "@type": "Answer",
                    text: "OTOCO (One-Triggers-Other-Cancel) orders let you set an entry price, take-profit, and stop-loss in a single order via Jupiter Trigger. When your entry executes, the take-profit and stop-loss orders are automatically placed. This enables 24/7 automated trading with full risk management while your capital earns yield.",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-full">
        {/* Neon background */}
        <div className="neon-bg">
          <div
            className="neon-streak"
            style={{ width: 500, height: 300, top: "10%", left: "20%", transform: "rotate(-30deg)" }}
          />
          <div
            className="neon-streak"
            style={{ width: 400, height: 250, top: "50%", right: "10%", transform: "rotate(20deg)" }}
          />
        </div>

        <ConvexProvider>
          <PrivyAuthProvider>
            <WalletProvider>
              <WalletAutoConnect />
              <div className="relative z-10 min-h-full flex flex-col">{children}</div>
            </WalletProvider>
          </PrivyAuthProvider>
        </ConvexProvider>
        <Analytics />
      </body>
    </html>
  );
}
