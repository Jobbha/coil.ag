# Limit Orders with Yield

## Overview

Coil's core feature: place a limit order and earn yield while waiting for it to fill.

## How It Works

1. **You set**: Token, target price, TP/SL, capital amount, yield vault
2. **Coil deposits**: Your USDC goes into Jupiter Lend → you get jlTokens
3. **While waiting**: jlTokens appreciate (~3-8% APY)
4. **Price hits**: Coil auto-swaps jlTokens → target token via Jupiter
5. **Order fills**: You hold the target token + earned yield bonus

## Order Types

### Simple Limit
Buy token X when price drops to $Y.

### OTOCO (Entry + TP + SL)
Buy token X at $Y, auto-sell at TP price for profit, or at SL price to cut losses. Three orders in one — Jupiter Trigger handles all three.

## Trigger Threshold

The trigger threshold determines how close the spot price needs to get to your target before Coil starts the execution process.

- **Must be smaller than your price distance** — If your target is 5% below spot, threshold must be < 5%
- **Smaller = more yield** — A 1% threshold means your capital earns yield longer
- **Larger = less slippage risk** — More time to execute before price moves

**Recommended**: 1-2% for most orders.

## Yield Vaults

Choose which Jupiter Lend vault to earn in:

| Vault | Token | Typical APY |
|-------|-------|-------------|
| USDC | USDC | 3-5% |
| USDG | Global Dollar | 4-6% |
| JupUSD | JupUSD | 3-5% |
| SOL | SOL | 3-5% |
| USDT | USDT | 2-4% |

If you choose a non-USDC vault, Coil automatically swaps your USDC to the vault token. You always deposit USDC — we handle the routing.

## Compound Yield

Toggle **"Compound yield into order"** to add earned yield to your buy size:

- **ON** (default): $10,000 deposit + $27 yield = $10,027 buys target token
- **OFF**: $10,000 buys target token, $27 stays as stablecoin in wallet
