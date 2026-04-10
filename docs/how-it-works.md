# How It Works

## The Coil Flow

### 1. Place Your Order
Pick a token (e.g., SOL), set your target price, take profit, and stop loss. Choose a yield vault — USDC, USDG, SOL, or others — based on the APY you want.

### 2. Capital Goes to Work
When you click "Start Coil", your USDC is deposited into Jupiter Lend. You receive jlTokens (e.g., jlUSDC) — yield-bearing receipt tokens that automatically appreciate in value as the lending pool earns interest.

If you choose a non-USDC vault (like USDG at higher APY), Coil automatically swaps your USDC to the vault token before depositing. One click, we handle the routing.

### 3. Earn While You Wait
Your jlTokens sit in your wallet, increasing in value every block. There's nothing to do — yield accrues automatically through the jlToken exchange rate.

### 4. Auto-Execute at Target
Coil monitors the price every 10 seconds. When the spot price enters your trigger threshold:

1. **Swap** — jlTokens are swapped back to USDC (capturing all yield earned)
2. **Deposit** — USDC goes into Jupiter Trigger vault
3. **Order placed** — Limit order with TP/SL created on Jupiter Trigger
4. **Jupiter fills** — The order executes 24/7 via Jupiter's infrastructure

### 5. Compound Option
If "Compound yield into order" is enabled (default), the yield you earned gets added to your buy. A $10,000 order that earned $27 in yield becomes a $10,027 buy — you get more of the target token for free.

## What Are jlTokens?

jlTokens are Jupiter Lend's receipt tokens. When you deposit USDC, you get jlUSDC. The jlUSDC/USDC exchange rate increases over time as the lending pool earns interest from borrowers.

- **jlUSDC** — Yield-bearing USDC
- **jlUSDG** — Yield-bearing USDG (Global Dollar)
- **jlSOL** — Yield-bearing SOL

Jupiter's Swap routing natively supports jlToken swaps, meaning the yield redemption and token swap happen in a single transaction. Zero idle time — your money earns until the exact moment of execution.

## Jupiter APIs Used

| API | Purpose |
|-----|---------|
| **Lend** | Deposit/withdraw for yield |
| **Price** | Real-time price monitoring |
| **Swap V2** | Token swaps + jlToken redemption |
| **Trigger** | 24/7 limit order execution |
| **Tokens** | Token search and metadata |
