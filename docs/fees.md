# Fee Structure

Coil charges two types of fees:

## Swap Fee — 0.1%

A 0.1% (10 basis points) fee is applied to every swap executed through Coil. This includes:

- The initial swap when depositing to a non-USDC vault (USDC → USDG, etc.)
- The execution swap when your limit order triggers (jlToken → target token)
- Any DCA slice swaps

This fee is routed through Jupiter's native `platformFeeBps` mechanism — it's deducted from the swap output, not charged separately.

**Example:** On a $10,000 order execution, the swap fee is $10.

## Yield Performance Fee — 8%

An 8% performance fee is taken on yield earned. This is only charged on the profit from lending, not on your principal.

**Example:** If your $10,000 order earns $27 in yield while waiting, the performance fee is $2.16. You keep $24.84 in extra buying power.

## No Hidden Fees

- No deposit fee
- No withdrawal fee
- No monthly/subscription fee
- No fee if your order doesn't fill
- Solana network fees (~$0.01 per transaction) apply as usual

## Fee Comparison

| Action | Coil | CEX Limit Order | Jupiter Direct |
|--------|------|-----------------|----------------|
| Place order | Earn yield | 0% (idle capital) | 0% (idle capital) |
| Execution | 0.1% | 0.1% (Binance) | 0% |
| Yield earned | Yes (minus 8% perf fee) | No | No |
| Net result | **You come out ahead** | Capital sits idle | Capital sits idle |

The math: even after fees, you earn more than doing nothing. A $10,000 order waiting 14 days earns ~$19-30 in yield. After the 8% performance fee ($1.50-2.40) and 0.1% swap fee ($10), you're still ahead by $7-18 compared to a regular limit order.
