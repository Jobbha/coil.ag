# DCA with Yield

## Overview

Dollar-cost average into any token while your idle capital earns yield between slices.

## How It Works

1. **You set**: Token, total capital, number of slices, interval
2. **Coil deposits**: ALL capital goes to Jupiter Lend upfront
3. **Each interval**: Coil swaps one slice (jlToken → target token)
4. **Remaining capital**: Keeps earning yield until its slice comes up

## The Advantage

With regular DCA: You deploy $500 over 10 days. The undeployed $450 on day 1 earns nothing.

With Coil DCA: All $500 earns yield from day 1. Each day, one $50 slice swaps while the remaining capital keeps earning.

**Example**: $10,000 DCA over 30 days, 5% APY
- Average idle capital: ~$5,000
- Yield earned: ~$20.55
- That's $20 of free tokens you wouldn't have gotten otherwise

## Intervals

| Interval | Best for |
|----------|----------|
| 1 hour | High conviction, volatile markets |
| 4 hours | Balanced approach |
| 1 day | Standard DCA |
| 1 week | Long-term accumulation |

## Price Range (Optional)

Set a min/max price to only execute slices when the price is within your preferred range. Slices outside the range are skipped and re-queued.
