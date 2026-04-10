# FAQ

## General

### What is Coil?
Coil is a DeFi platform that earns yield on your idle limit order capital. Instead of your USDC sitting doing nothing while waiting for a price target, Coil deposits it into Jupiter Lend to earn interest automatically.

### How is this different from a regular limit order?
A regular limit order: your capital sits idle earning 0%.
A Coil order: your capital earns 3-8% APY while waiting. When the price hits, Coil auto-executes. You get the same trade, plus free yield.

### Do I need to keep the app open?
The price monitoring and auto-execution work when the app is open in your browser. For 24/7 execution, orders are placed on Jupiter Trigger which runs independently.

### What tokens can I trade?
Any token available on Jupiter — SOL, JUP, ETH, BONK, RAY, and thousands more.

### What's the minimum order size?
$10 minimum. However, for very small amounts the transaction fees (~$0.01 SOL) may offset the yield earned.

## Yield

### Where does the yield come from?
Jupiter Lend. Borrowers pay interest to borrow tokens, and that interest is distributed to lenders (you). It's real yield from real economic activity.

### What APY can I expect?
APY varies by vault and market conditions:
- **USDC**: typically 3-5%
- **USDG**: typically 4-6%
- **SOL**: typically 3-5%

These rates change based on borrowing demand.

### Is there liquidation risk?
No. You're a lender, not a borrower. There's no collateral, no margin, no liquidation. Your deposit is safe (minus smart contract risk).

### What is "Compound yield into order"?
When enabled (default), the yield you earn gets added to your buy. If you deposited $1,000 and earned $5 in yield, Coil swaps all $1,005 into the target token. You get more for free.

When disabled, the yield stays as stablecoin in your wallet and only the original $1,000 buys the target token.

## Fees

### What fees does Coil charge?
- **0.1% swap fee** on every execution
- **8% yield performance fee** on yield earned (not on principal)

### Are there any hidden fees?
No. No deposit fees, no withdrawal fees, no subscription. Just the swap fee and yield performance fee.

### How does the fee compare to not using Coil?
Even after fees, you come out ahead. A $10,000 order waiting 14 days earns ~$19-30 in yield. After all fees (~$12-13), you still made $7-18 more than a regular limit order.

## Security

### Is Coil custodial?
No. Coil never holds your funds. Every transaction is signed by your wallet. Your jlTokens (yield receipts) stay in your own wallet.

### What if Coil goes down?
Your funds are safe in Jupiter Lend. You can withdraw directly from Jupiter's interface at any time. Coil is just a frontend.

### Has the code been audited?
Coil uses Jupiter's audited smart contracts for all on-chain operations. We don't deploy our own contracts.

## Technical

### What wallets are supported?
Phantom, Solflare, and any Solana wallet that supports the Wallet Standard. You can also sign in with email/Google (Privy creates an embedded wallet).

### What blockchain is this on?
Solana. All transactions are on Solana mainnet.

### What APIs does Coil use?
Jupiter Price, Lend, Swap V2, Trigger, and Tokens APIs. Chart data from GeckoTerminal.
