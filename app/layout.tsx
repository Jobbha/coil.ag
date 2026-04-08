import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import PrivyAuthProvider from "@/components/PrivyAuthProvider";
import WalletProvider from "@/components/WalletProvider";
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
  title: "Coil — Earn While You Wait",
  description:
    "Put idle limit-order capital to work. Earn yield via Jupiter Lend while waiting for your target price.",
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

        <PrivyAuthProvider>
          <WalletProvider>
            <div className="relative z-10 min-h-full flex flex-col">{children}</div>
          </WalletProvider>
        </PrivyAuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
