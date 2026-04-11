# Coil — Jupiter Developer Experience Report

**Project:** Coil — Earn yield on idle limit order capital  
**Builder:** @coil_ag  
**APIs used:** Swap V2, Lend, Trigger, Price, Tokens  
**AI Stack used:** Jupiter Agent Skills (via `npx skills add`), Claude Code  
**Build time:** ~16 hours across 3 days  
**Repo:** https://github.com/Jobbha/coil.ag  
**Live:** https://coil-ag-1q5p.vercel.app  
**Docs:** https://coil-1.gitbook.io/coil-docs

---

## What we built

Coil combines Jupiter Lend + Swap V2 + Trigger + Price APIs into a single product: **yield-bearing limit orders**. When a user places a limit order, instead of capital sitting idle, it deposits into Jupiter Lend to earn 3-8% APY. When the price approaches the target, Coil auto-swaps the jlToken → target token via Swap V2, or places the order on Jupiter Trigger for 24/7 execution with TP/SL (OTOCO).

The key insight: Jupiter Swap V2 natively routes through jlTokens, meaning the Lend redemption and swap happen in **a single transaction**. The user earns yield until the exact moment of execution.

We also built DCA with yield (deposit all capital to Lend upfront, swap out in scheduled slices while remaining capital earns), and an optional "compound yield" toggle that adds earned yield to the buy size.

APIs combined in a way you didn't design for: **Lend jlTokens as swap input → Swap V2 handles redemption internally → Trigger places the limit order → Price monitors for trigger threshold**. Four APIs, one seamless flow.

---

## Onboarding & First API Call

**Time to first successful API call: ~8 minutes.**

Getting the API key at developers.jup.ag was instant — one click, key generated. The dashboard is clean.

First call was to the Price API (`/price/v3?ids=...`). Worked immediately. Clear response shape, no surprises.

**What went well:**
- Single API key for everything — didn't need separate keys for Swap, Lend, Trigger
- The `x-api-key` header pattern is simple and consistent across all endpoints
- Dashboard analytics showing our usage was a nice touch

**What could improve:**
- The docs landing page could link directly to quickstart code snippets per API. We had to navigate to find the actual endpoint docs.

---

## API-by-API Feedback

### Price API — Great ✅
- Clean, fast, reliable
- Response shape `{ [mint]: { usdPrice, priceChange24h, ... } }` is intuitive
- We poll this every 10 seconds for active orders. No rate limit issues.
- **Missing:** No historical price endpoint. We had to use GeckoTerminal for OHLCV chart data. If Jupiter exposed `/price/v3/history?mint=X&tf=15m`, we wouldn't need a third-party dependency.

### Tokens API — Great ✅
- Search works well, returns relevant results quickly
- Token metadata (icon, decimals, symbol) is complete
- `organic_score` is interesting — could be used for DCA strategies

### Lend API — Major issues ⚠️

**What worked:**
- `/lend/v1/earn/tokens` — vault list with APYs. Clean.
- `/lend/v1/earn/deposit` and `/withdraw` — returns unsigned transactions. Sign and send. Works.

**What didn't:**

1. **`/lend/v1/earn/positions?wallet=X` returns empty `[]` even when the user has active Lend positions.** This was our biggest friction point. We spent 2+ hours debugging. Phantom shows the positions fine (it reads on-chain jlToken balances directly). We had to build our own positions endpoint that queries the wallet's token accounts via RPC and checks for known jlToken mints. **This should just work from the API.**

2. **jlTokens use Token-2022, not regular SPL Token.** The docs don't mention this. When we queried `getTokenAccountsByOwner` with the standard SPL Token program ID, jlUSDG didn't show up. We had to add a second query for `TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb`. **A note in the Lend docs about Token-2022 would save builders hours.**

3. **No jlToken exchange rate endpoint.** We needed to show the underlying value (3.82 jlUSDG = 4.00 USDG) but there's no endpoint for the exchange rate. We used the Price API to get jlToken USD price and calculated backwards. An endpoint like `/lend/v1/earn/exchange-rate?mint=jlUSDG` would be ideal.

4. **Withdraw amount confusion.** The withdraw endpoint takes `amount` in underlying asset units, but users hold jlTokens (which have a different amount due to appreciation). We initially passed the jlToken amount and it withdrew less than the full position. **Docs should clarify: "amount is in underlying token units, not jlToken units."**

### Swap V2 API — Critical field name mismatch ⚠️

**This cost us ~3 hours of debugging:**

The Swap V2 response uses `transaction` as the field name, but documentation and examples reference `swapTransaction`. We built our entire flow around `data.swapTransaction` and it was always `undefined`. The swap quote data came back fine (routePlan, priceImpact), but we couldn't get the transaction to sign.

We finally figured it out by logging the full response keys:

```
Keys: swapType, inAmount, outAmount, ..., transaction, ..., requestId
Has swapTransaction: false
```

Similarly, `outAmount` not `outputAmount`.

**Recommendation:** Either update the response field to `swapTransaction` (matching existing docs/examples) or update all docs to reference `transaction`. This is the #1 friction point we hit.

**Positive:** jlToken → any token routing works beautifully. Single transaction handles Lend redemption + swap. This is what makes Coil possible.

### Trigger API — Works, docs sparse ⚠️

**What worked:**
- Challenge → verify → JWT flow is clean
- OTOCO orders (entry + TP + SL) work
- Signed deposit tx + order creation in one call is elegant

**What we struggled with:**
1. **JWT lifetime isn't documented.** How long does it last? We store it and don't know when to refresh.
2. **No webhook for order fills.** We poll `/orders/history` to check status. A webhook would be much better.
3. **Error messages are opaque.** Just HTTP status + truncated body. Specific error codes would help.
4. **`signedDepositTxn` parameter name is confusing.** Is it the signed tx bytes or the tx signature hash? Clarify in docs.

### Recurring (DCA) — Not used directly
We built our own DCA on Lend + Swap because we wanted yield between slices. If the Recurring API supported depositing to Lend first, that would be a native "DCA with yield" feature.

### Prediction Markets — Browsing only
We proxy the prediction endpoint for market listings. Worked fine. Couldn't find documentation for the betting/trading endpoint.

---

## AI Stack Feedback

### Jupiter Agent Skills ⭐

Installed via `npx skills add jup-ag/agent-skills`. Four skills installed: `integrating-jupiter`, `jupiter-lend`, `jupiter-swap-migration`, `jupiter-vrfd`.

**Honest assessment:** We installed these on day 2, after hitting all the friction points. **We should have installed them on day 1.** The `jupiter-lend` skill likely would have warned us about Token-2022 and jlToken exchange rates before we wasted hours debugging.

**Recommendations:**
- Put a **giant banner** on developers.jup.ag: "Using Claude Code / Cursor / Codex? Run `npx skills add jup-ag/agent-skills` first"
- Add a skill for the **Trigger API** (not currently covered)
- Include skill content in the main docs, not just a separate repo

### Claude Code (primary build tool)

We built the entire Coil app using Claude Code (Opus model). It wrote all Jupiter API client code, the state machine, auth integration, security hardening, and documentation.

**What worked:** Rapid prototyping. 16 hours from zero to deployed product with real on-chain transactions.

**What didn't:** Without Jupiter Agent Skills installed, Claude Code used stale training data — e.g., `swapTransaction` instead of `transaction`. The skills would have prevented our biggest debugging session.

### Jupiter CLI — Not used
Our use case is a web app, not terminal/agent execution. CLI seems more suited for bots and Telegram integrations.

### Docs MCP — Not used
Accessed docs via the website. MCP would've been useful if integrated into Claude Code from the start.

---

## What's broken or missing in docs

| Issue | Where | Impact |
|-------|-------|--------|
| Swap V2 field names wrong (`transaction` not `swapTransaction`) | Swap API docs | 3 hours lost |
| Lend positions returns empty | Lend API docs | 2 hours lost |
| No mention of Token-2022 for jlTokens | Lend API docs | 1 hour lost |
| No jlToken exchange rate endpoint | Lend API docs | Workaround needed |
| Trigger JWT lifetime undocumented | Trigger API docs | Unknown behavior |
| No historical price data | Price API docs | External dependency |
| Prediction trading endpoint undocumented | Prediction docs | Feature blocked |

---

## How we'd rebuild developers.jup.ag

1. **Quickstart code on the landing page.** Show a working `fetch` call for each API. Copy-paste → run → see result. Don't make people navigate to find code.

2. **Interactive API playground.** Swagger/Postman built into docs. Enter params, see live response. Would have caught the field name issue instantly.

3. **"AI-first" onboarding.** First thing you see: "Using an AI coding agent? Run `npx skills add jup-ag/agent-skills` first." Most hackathon builders use AI agents.

4. **Consistent response shapes.** `transaction` vs `swapTransaction`, `outAmount` vs `outputAmount` — pick one convention across all APIs.

5. **WebSocket for Trigger.** Polling for order status is expensive. Push notifications for order fills would enable real-time UIs.

6. **Fix Lend positions.** The `/positions` endpoint returning empty is a showstopper for any Lend integration.

---

## What we wish existed

1. **`/lend/v1/earn/exchange-rate`** — jlToken → underlying conversion
2. **`/price/v3/history`** — OHLCV candle data (no GeckoTerminal dependency)
3. **`/trigger/v2/webhooks`** — Push notifications for order events
4. **`/recurring/v1/with-yield`** — DCA that deposits idle capital to Lend between slices
5. **`@jup-ag/sdk`** — TypeScript SDK wrapping all APIs with types + retry logic

---

## Summary

Jupiter's Developer Platform is genuinely impressive — one key, clean APIs, real infrastructure. We built a full DeFi product with real on-chain transactions in 16 hours. That speaks to API quality.

The friction was real but mostly documentation-related. Fix the Swap V2 field names, make Lend positions work, document Token-2022 — and the experience goes from "good with gotchas" to "exceptional."

The combination of **Lend jlToken routing through Swap V2** is the most underrated feature in the Jupiter ecosystem. Yield redemption + swap in a single transaction. We built an entire product around it. That's what good APIs enable.
