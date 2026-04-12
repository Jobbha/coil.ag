# Coil — SEO & LLM Optimization Playbook

## Product Context
- **Name:** Coil
- **What:** Non-custodial DeFi platform on Solana — earn yield on idle limit order capital via Jupiter Lend
- **Audience:** Crypto traders on Solana who place limit orders
- **Live:** coil-ag-1q5p.vercel.app (moving to coil.ag)
- **Docs:** coil-1.gitbook.io/coil-docs
- **Twitter:** @coil_ag
- **Stack:** Next.js 16, React 19, Tailwind v4, Convex, Vercel
- **Built for:** Jupiter Frontier Hackathon 2026

---

## 1. Technical SEO

### Meta Tags (every page)
- Title: max 60 chars, include primary keyword
- Description: max 155 chars, include CTA or value prop
- OpenGraph: title, description, image, url, type
- Twitter Card: summary_large_image (crypto audience lives on X)
- Canonical URL on every page

### Target Titles
| Page | Title (max 60 chars) |
|------|---------------------|
| Homepage | Coil — Earn Yield on Idle Limit Orders \| Solana DeFi |
| How it works | How Coil Works: Earn 3-8% APY on Waiting Orders |
| Fees | Coil Fees: 0.1% Swap, No Hidden Costs |
| Points | Coil Points & Referrals: Earn on Every Trade |

### Robots.txt
```
User-agent: *
Allow: /
Disallow: /api/

# Allow AI crawlers explicitly
User-agent: GPTBot
Allow: /
User-agent: ChatGPT-User
Allow: /
User-agent: PerplexityBot
Allow: /
User-agent: ClaudeBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Google-Extended
Allow: /

Sitemap: https://coil.ag/sitemap.xml
```

### Structured Data (JSON-LD)
- **Organization:** name, url, logo, sameAs (Twitter)
- **WebApplication:** applicationCategory: DeFi, operatingSystem: Web
- **FAQPage:** on homepage or dedicated FAQ section

### Sitemap
All public pages with priorities:
- / → 1.0
- /how-it-works → 0.8
- /fees → 0.7
- /points → 0.7

---

## 2. LLM / AI Search Optimization

### llms.txt (public/llms.txt)
Concise summary (<50 lines):
- What Coil is
- Key features
- How it works (3-step)
- Links to docs, site, Twitter

### llms-full.txt (public/llms-full.txt)
Comprehensive version:
- Full product description
- All features explained
- Technical architecture (Jupiter APIs, jlTokens)
- Fee structure (0.1% swap, 8% yield performance)
- Security model (non-custodial, no smart contracts)
- Supported tokens (SOL, USDC, USDG, JupUSD, USDT, etc.)
- Points system (100 first order, 25 per order, 50 per referral, 10 per $1 yield)
- Referral system
- FAQ section
- All links

### Content Extractability Rules
- Lead every section with a direct answer
- Keep key passages to 40-60 words (optimal for snippet extraction)
- Use specific numbers: "3-8% APY" not "high yield"
- Tables beat prose for comparisons
- Each paragraph = one clear idea
- H2/H3 headings should match how people search

### FAQ Questions to Include (with FAQPage schema)
1. What is Coil?
2. How does Coil earn yield on limit orders?
3. Is Coil safe / non-custodial?
4. What fees does Coil charge?
5. What tokens does Coil support?
6. How do Coil points work?
7. What is a jlToken?
8. How does auto-execution work?
9. What are OTOCO orders?
10. Does Coil have liquidation risk?

---

## 3. Target Keyword Clusters

### High Priority (product-specific, low competition)
- "earn yield limit orders"
- "yield on idle capital crypto"
- "solana limit order yield"
- "jupiter lend yield"
- "non-custodial yield solana"
- "earn while waiting crypto"
- "defi limit order platform"

### Medium Priority (broader, more competitive)
- "solana defi yield"
- "defi limit orders"
- "crypto limit order platform"
- "solana trading platform"
- "jupiter swap"

### Long-tail Opportunities
- "how to earn yield on limit orders solana"
- "idle capital defi solution"
- "jupiter lend auto compound"
- "limit order yield farming solana"
- "best solana defi for limit orders"

---

## 4. Content Pages to Create

### /how-it-works
- The problem: idle capital earning 0% during limit orders
- The solution: deposit to Jupiter Lend, earn yield, auto-execute
- Step-by-step flow with clear headings
- Security & non-custodial benefits
- Visual flow diagram if possible

### /fees
- Clear fee table: 0.1% swap fee, 8% yield performance fee
- What you DON'T pay: no deposit, withdrawal, subscription fees
- Comparison with CEX fees
- Fee calculator example

### /points
- How to earn Coils (100 first, 25 per order, 50 referral, 10 per $1 yield)
- Referral system: unique code, share link, track in dashboard
- Why points matter (future utility)

### /compare (future)
- "Coil vs Regular Limit Orders" — show yield difference
- "Coil vs Leaving Capital Idle" — ROI calculator
- Comparison tables with specific numbers

---

## 5. Third-Party Presence (Off-Site SEO)

### X/Twitter (Primary Channel)
- Thread: "I just found a way to earn yield while my limit orders wait..."
- Thread: "The hidden cost of limit orders that nobody talks about"
- Regular posts about yield earned, trades executed
- Engage with Jupiter, Solana, DeFi communities
- Use @coil_ag handle, link to site

### GitBook Docs
- Ensure well-structured for AI extraction
- Include FAQ in docs
- Cross-link between docs and site

### Community
- Post in Solana/Jupiter Discord
- Reddit: r/solana, r/defi (authentic participation)
- YouTube: demo video with SEO-optimized title/description

### Hackathon
- Jupiter Frontier Hackathon submission page
- Any press/coverage from the hackathon

---

## 6. Monitoring & Next Steps

### Search Console Setup
1. Verify coil.ag domain
2. Submit sitemap
3. Request indexing for all pages
4. Monitor impressions/clicks weekly

### AI Visibility Check (Monthly)
Test these queries across ChatGPT, Perplexity, Google AI Overviews:
- "earn yield on limit orders"
- "solana defi yield platform"
- "what is coil defi"
- "jupiter lend yield"

### Success Metrics
- Indexed pages in Google
- Impressions growth week-over-week
- CTR on key queries
- AI citation rate (manual check)
- Referral signups from organic

---

## Quick Reference: What We Did for OpenKlauw (Apply Same Pattern)

1. Meta titles/descriptions optimized for exact search queries
2. llms.txt + llms-full.txt created
3. robots.txt allowing AI bots, blocking /api/
4. Sitemap with priorities
5. Structured data (Organization, FAQPage, WebApplication)
6. Blog/content pages targeting keyword clusters
7. FAQ sections with schema markup
8. Internal linking between pages
9. noindex on non-essential pages (privacy, cookies, etc.)
10. Search Console: submit sitemap, request indexing for key pages
11. Snippet optimization: titles with numbers, prices, timeframes
12. Re-index requests after every content update
