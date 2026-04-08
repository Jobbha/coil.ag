@AGENTS.md

# Coil — Development Guidelines

## What Coil Is
A Solana DeFi platform where idle capital earns yield via Jupiter Lend while waiting for limit orders, DCA, or other strategies to execute. Built for the Jupiter Frontier Hackathon.

## Think Like a Trader
You are building for experienced crypto traders. Every decision should ask: "Would a trader on Axiom, Jupiter, or Photon expect this?" If yes, it should already work. Don't ask permission for obvious features — build them.

- **Never leave stub/mock data in production.** If a button exists, it must do something real. If data is shown, it must come from on-chain or API, not hardcoded values.
- **Never require users to own obscure tokens.** If the app needs USDG but user has USDC, swap for them automatically. Remove ALL friction.
- **Orders must work 24/7.** Limit orders that only trigger when the app is open are not limit orders. Use Jupiter Trigger API for real execution.
- **All state must be verifiable on-chain.** Don't trust localStorage alone — verify against Lend positions, Trigger order history, and wallet balances.

## Architecture

### Jupiter APIs (all via `lib/jupiter.ts`, proxied through `/api/*` routes)
- **Price API** — real-time token prices, polled every 10s
- **Lend API** — deposit/withdraw for yield (jlTokens)
- **Swap V2 API** — token swaps, jlToken redemption in one tx
- **Trigger API** — 24/7 limit orders with TP/SL (OTOCO), requires JWT auth
- **Tokens API** — search and metadata

### Core Flow (Limit Orders)
1. User deposits USDC → Jupiter Lend (gets jlUSDC, earns yield)
2. If vault ≠ USDC, auto-swap USDC → vault token first
3. Gets Trigger JWT upfront (challenge → sign → verify)
4. Engine polls price every 10s
5. When price hits threshold → auto-swap jlToken → USDC → Trigger deposit → create order
6. Jupiter fills 24/7. Engine polls Trigger history for status.
7. Every 30s, verify Lend positions on-chain — stale orders auto-expire.

### DCA Flow
1. Deposit ALL capital to Lend upfront
2. Engine swaps slices on schedule (1h/4h/1d/1w)
3. Remaining capital keeps earning yield between slices

### Key Files
- `lib/coilEngine.ts` — State machine (IDLE→LENDING→APPROACHING→PLACED→FILLED)
- `lib/useCoilEngine.ts` — React hook: polling, auto-execution, on-chain verification
- `lib/jupiter.ts` — Jupiter API client (server-side, uses API key)
- `lib/jlTokens.ts` — jlToken registry + Coil flow documentation
- `components/SetupForm.tsx` — Order creation with real Lend deposit + Trigger auth
- `components/PositionsPanel.tsx` — Active orders with execute/cancel, on-chain state

### Auth
- **Privy** for user accounts (email, Google, wallet login)
- **Solana Wallet Adapter** for on-chain signing (Phantom, Solflare, Privy embedded)
- Both coexist: Privy = account, Wallet = transactions

### Env Vars (must be set on Vercel too)
- `JUPITER_API_KEY` — server-side Jupiter API auth
- `NEXT_PUBLIC_PRIVY_APP_ID` — Privy client ID
- `PRIVY_APP_SECRET` — Privy server secret
- `NEXT_PUBLIC_HELIUS_RPC_URL` — Solana RPC (Helius)

## Rules
- Always use USDC as the user-facing input currency. Swap to vault token behind the scenes.
- Never show mock/estimated data when real API data is available.
- Every CTA button must have a working handler. No empty onClicks.
- When adding a feature, wire it end-to-end: UI → API → on-chain tx → state update.
- Test the full signing flow mentally: does the user need to approve? How many popups? Minimize.
- If a wallet isn't connected, the CTA should open the wallet modal, not show "disabled".
- Charts use GeckoTerminal OHLCV with known pool overrides for popular tokens.
- Error messages must be user-friendly. Strip API keys, truncate long errors.
