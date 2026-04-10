# Getting Started

## 1. Connect Your Wallet

Visit [coil.ag](https://coil.ag) and click **Log In**. You can sign in with:

- **Phantom** (recommended) — Your existing Solana wallet
- **Solflare** — Alternative Solana wallet
- **Email** — Creates a Privy embedded wallet for you
- **Google** — Creates a Privy embedded wallet for you

## 2. Pick a Token

On the Spot tab, browse or search for a token you want to buy (SOL, JUP, ETH, etc.). Click on it to open the trading view.

## 3. Set Your Order

- **You deposit** — Amount in USDC to deploy
- **Buy at** — Your target entry price (use the slider for quick %)
- **TP / SL** — Optional take profit and stop loss levels
- **Earn yield in** — Choose a vault (USDC, USDG, SOL) based on APY
- **Compound yield** — Toggle to add earned yield to your buy size
- **Trigger threshold** — How close the price needs to get before executing (must be less than your price distance)

## 4. Start Coil

Click **Start Coil**. You'll sign 2-3 transactions:

1. **Swap** (if non-USDC vault) — USDC swaps to vault token
2. **Deposit** — Capital goes into Jupiter Lend
3. **Auth** — Signs challenge for Jupiter Trigger access

## 5. Monitor & Earn

Your position shows in the **Active** tab:
- Current value and token amount
- APY being earned
- Daily/monthly yield projections
- Limit order price

When the price hits your threshold, Coil auto-executes. You can also:
- **Force Execute** — Swap at market price immediately
- **Withdraw & Close** — Pull funds back to wallet

## 6. Check History

The **History** tab shows completed and cancelled orders with yield earned.
