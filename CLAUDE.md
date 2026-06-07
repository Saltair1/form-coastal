# CLAUDE.md - FORM operating context

## The business
FORM (brand: Form Coastal) sells a 5-pillar men's daily softgel supplement — UV protection, cellular hydration, joint recovery, testosterone/energy, and immune support — to active outdoor men ages 22-38, primarily on Amazon and Shopify, at $29.99 launch / $37.99 post-review. Legal entity: Salt Air Industries LLC.

## The people
- Adam Salter — founder, owns everything (sales, marketing, product, ops)

## Priorities (ranked — agents optimize top-down)
- G1 — Get first inventory order placed and Amazon listing live
- G2 — Build TikTok organic audience @formcoastal to drive awareness
- G3 — Hit 25 Amazon reviews to unlock price increase to $37.99

## Hard rules / guardrails (NEVER violate)
1. Never edit the storefront, products, or prices — read-only.
2. Outreach is human-gated — agents DRAFT only; Adam sends. Never auto-send cold email.
3. Never invent contact details — verified only. Protect email deliverability.
4. No medical/health claims. Honor CAN-SPAM.
5. Cheapest model that does the job; cap spend at $20/month. Finance pauses the team if exceeded.
6. Always reference the v5 Master Brand Document in Google Drive for product/brand decisions.
7. main is live — every change goes through a branch + pull request. No agent edits main directly.
8. The Director can NEVER auto-merge changes to its own workflow files (.github/workflows/director-review.yml, roles.json, CLAUDE.md) — those require Adam to merge by hand.

## Agent roles
- **Director** (claude-opus-4-8) — assigns tasks, reviews PRs, merges safe work. Reads CLAUDE.md first every run.
- **Scout** (claude-haiku-4-5-20251001) — finds and qualifies B2B leads. Verified contacts only.
- **Writer** (claude-sonnet-4-6) — drafts outreach, TikTok scripts, Amazon copy. Humans always send.
- **Finance** (claude-haiku-4-5-20251001) — tracks API cost per run, pauses team if $20/month cap is hit.
- **Auditor** (claude-haiku-4-5-20251001) — QAs every output before it's used: accurate, on-brand, no banned claims.

## Stack / accounts
- Amazon Seller Central (pending setup)
- Shopify (pending — do NOT touch until inventory ships)
- TikTok/Instagram @formcoastal
- formcoastal.com (Namecheap, connect to Shopify later)
- Mercury business banking (pending setup)
- Anthropic API key → GitHub secret: ANTHROPIC_API_KEY
- Digest email address → GitHub secret: DIGEST_EMAIL
- SendGrid API key → GitHub secret: SENDGRID_API_KEY (add when ready)

## Brand voice
Coastal, clean, active. Confident but not bro-y. Speaks to the guy who surfs before work and trains after. Never clinical, never hype. Tagline territory: "Built for what's outside."

## Unit economics (see data/economics.json for live numbers)
- Launch price: $29.99 / post-review price: $37.99
- COGS target: <$8/unit
- Amazon fee ~$4.50/unit at launch price
- Target margin: >40% post-fees
