# Security

## Non-Custodial

Coil never holds your funds. Every transaction is signed by your wallet and executed on-chain. Your capital goes directly to:

- **Jupiter Lend** — Audited lending protocol
- **Jupiter Trigger** — Audited limit order system
- **Your wallet** — jlTokens (yield receipts) stay in YOUR wallet

We cannot move, freeze, or access your funds. Period.

## What We Don't Store

- Private keys — never touched, never seen
- Seed phrases — never asked for
- Transaction signing — always done in your wallet (Phantom/Solflare)

## What We Do Store

- **Privy account** — Email or wallet address for login
- **Order metadata** — Target price, TP/SL, strategy (used to display your positions)
- **Referral codes** — For the referral program

## Smart Contract Risk

Coil uses Jupiter's battle-tested infrastructure:

- **Jupiter Lend** — TVL of $10M+, audited
- **Jupiter Swap** — Largest DEX aggregator on Solana
- **Jupiter Trigger** — Production limit order system

We do not deploy our own smart contracts. All on-chain operations go through Jupiter's verified programs.

## No Liquidation Risk

Jupiter Lend is supply-only for Coil users. You deposit, you earn, you withdraw. There is:

- No borrowing
- No collateral
- No margin
- No liquidation

Your principal is safe. The only risks are smart contract risk (Jupiter bug) and stablecoin depeg risk (USDC/USDG loses peg).

## Input Validation

All API inputs are validated:
- Wallet addresses checked against Solana base58 format
- Amounts validated as positive integers
- Slippage capped at 5% maximum
- Order parameters whitelisted before forwarding to Jupiter

## Content Security Policy

The app enforces a Content Security Policy that restricts script execution, API connections, and resource loading to trusted origins only.
