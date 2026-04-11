# Coil — Earn Yield on Idle Limit Order Capital

A Solana DeFi platform that earns yield on your idle capital while waiting for limit orders to fill. Built with Jupiter Developer Platform APIs.

**Live:** https://coil-ag-1q5p.vercel.app  
**Docs:** https://coil-1.gitbook.io/coil-docs  
**DX Report:** [DX-REPORT.md](./DX-REPORT.md)  
**Twitter:** [@coil_ag](https://x.com/coil_ag)

## The Problem

Every limit order locks up capital that earns nothing. On CEXs, on Jupiter, everywhere — your USDC sits idle while you wait hours, days, or weeks for your price to hit.

## The Solution

Coil deposits your capital into Jupiter Lend the moment you place an order. Your money earns 3-8% APY while waiting. When the price approaches your target, Coil auto-executes via Jupiter Swap V2 and Trigger APIs — 24/7, even when you're offline.

## Key Innovation

Jupiter Swap V2 natively routes through jlTokens (Lend receipt tokens), meaning the yield redemption and token swap happen in **a single transaction**. Your money earns until the exact moment of execution. Zero idle time.

## Features

- **Yield-Bearing Limit Orders** — Earn while you wait, auto-execute when price hits
- **OTOCO Orders** — Entry + Take Profit + Stop Loss in one
- **DCA with Yield** — Dollar-cost average while idle slices earn
- **Compound Yield** — Option to add earned yield to your buy size
- **Non-Custodial** — Your funds, your wallet, your keys
- **On-Chain Verification** — Positions verified against real jlToken balances every 15s

## Jupiter APIs Used

| API | Purpose |
|-----|---------|
| **Lend** | Deposit/withdraw for yield via jlTokens |
| **Swap V2** | Token swaps + jlToken redemption in one tx |
| **Trigger** | 24/7 limit order execution with TP/SL (OTOCO) |
| **Price** | Real-time price monitoring (10s polling) |
| **Tokens** | Token search, metadata, verification |

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4
- **Auth:** Privy (email, Google, wallet login)
- **Wallets:** Solana Wallet Adapter (Phantom, Solflare)
- **Charts:** Lightweight Charts (TradingView) + GeckoTerminal OHLCV
- **Backend:** Convex (serverless DB for orders, users, referrals)
- **RPC:** Helius
- **Deploy:** Vercel

## Architecture

```
User → Privy Auth → Connect Wallet
  → Pick Token → Set Limit Price + TP/SL + Yield Vault
  → Deposit USDC → (auto-swap if non-USDC vault) → Jupiter Lend
  → jlTokens earn yield in wallet
  → Engine polls price every 10s
  → Price hits threshold → auto-swap jlToken → target token
  → OR → deposit to Jupiter Trigger → 24/7 limit order
```

### Key Files

| File | Purpose |
|------|---------|
| `lib/coilEngine.ts` | State machine: IDLE → LENDING → APPROACHING → PLACED → FILLED |
| `lib/useCoilEngine.ts` | React hook: polling, auto-execution, on-chain verification |
| `lib/jupiter.ts` | Jupiter API client (Lend, Swap, Trigger, Price, Tokens) |
| `lib/jlTokens.ts` | jlToken registry + flow documentation |
| `components/SetupForm.tsx` | Order creation with real Lend deposit + Trigger auth |
| `components/PositionsPanel.tsx` | Active orders with on-chain position display |
| `app/api/positions/route.ts` | Direct RPC check for jlToken balances (SPL + Token-2022) |
| `convex/` | Backend: users, orders, positions, referrals |

## Quick Start

```bash
git clone https://github.com/Jobbha/coil.ag.git
cd coil.ag
npm install
cp .env.example .env.local  # Add your API keys
npm run dev
```

## Environment Variables

```
JUPITER_API_KEY=            # developers.jup.ag
NEXT_PUBLIC_PRIVY_APP_ID=   # dashboard.privy.io
PRIVY_APP_SECRET=           # dashboard.privy.io
NEXT_PUBLIC_HELIUS_RPC_URL= # helius.dev
COIL_FEE_WALLET=            # Solana wallet for fee collection
```

## Built for Jupiter Frontier Hackathon

Coil combines 5 Jupiter APIs in a way they weren't designed for — turning idle limit order capital into yield-bearing positions that auto-execute. The DX report documents every friction point, bug, and improvement suggestion from the build process.

[Read the full DX Report →](./DX-REPORT.md)
