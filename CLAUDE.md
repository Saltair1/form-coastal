# CLAUDE.md - FORM operating context

## The business
FORM (brand: Form Coastal) sells a 5-pillar men's daily softgel supplement — UV protection, cellular hydration, joint recovery, testosterone/energy, and immune support — to active outdoor men ages 22-38, primarily on Amazon and Shopify, at $29.99 launch / $37.99 post-review. Legal entity: Salt Air Industries LLC. Founder: Adam Salter, 25, Oceanside CA.

Product on label/listing/packaging: **FORM** (one word, clean)
Brand/domain/handles: **Form Coastal** (digital and legal infrastructure only)
Domain: formcoastal.com ✅
Instagram/TikTok: @formcoastal ✅ (existing 25k follower account, renamed June 2026)

## The founder IS the customer
Adam surfs, lifts, plays soccer, trains outdoors, eats clean, lives in 300 days of San Diego sun. The supplement solves 5 problems he personally had: dehydration despite drinking a gallon/day, joint wear from multi-sport training, daily UV/oxidative stress, clean energy without stimulants, and baseline immune support. This is the core marketing story.

## The people
- Adam Salter — founder, owns everything (sales, marketing, product, ops). CS degree, medical device sales rep, can build React apps.

## Priorities (ranked — agents optimize top-down)
- G1 — Get EIN, open Mercury business bank account, receive and evaluate manufacturer quotes
- G2 — Build TikTok organic audience @formcoastal (first post as FORM this week — no product needed)
- G3 — Hit 25 Amazon reviews after launch → unlock $37.99 price increase

## Immediate next steps (in order)
1. Open Mercury business checking at mercury.com — under Salt Air Industries LLC EIN
2. Receive manufacturer quotes from Aurinutra + Innova Nutra (sent June 2026, awaiting response)
3. Post first TikTok as FORM this week — lifestyle content, no product needed
4. Sign up for Helium 10 free trial, run Cerebro on Heliocare ASIN: B0DLLHVQP1
5. Design label in Canva Pro after formula locked
6. Place first inventory order 250-500 softgel units
7. Open Amazon Professional Seller account ($39/mo) before inventory ships
8. Open Shopify ($39/mo) the WEEK inventory ships — NOT before

## Hard rules / guardrails (NEVER violate)
1. Never edit the storefront, products, or prices — read-only.
2. Outreach is human-gated — agents DRAFT only; Adam sends. Never auto-send cold email.
3. Never invent contact details — verified only. Protect email deliverability.
4. No medical/health claims. Honor CAN-SPAM.
5. Cheapest model that does the job; cap spend at $20/month. Finance pauses the team if exceeded.
6. Always reference the v5 Master Brand Document in Google Drive (owner: apsalter11@gmail.com) for product/brand decisions. Always use the highest version number.
7. main is live — every change goes through a branch + pull request. No agent edits main directly.
8. The Director can NEVER auto-merge changes to CLAUDE.md, roles.json, or any file in .github/workflows/ — those require Adam to merge by hand.
9. Do NOT open Shopify until inventory is ordered.

## The formula — 9 core ingredients (non-negotiable)
Format: softgel with true lipid encapsulation (required for fat-soluble ingredients like astaxanthin)

1. Polypodium Leucotomos extract — UV/antioxidant protection (hero ingredient, same as Heliocare)
2. Astaxanthin — natural, from Haematococcus pluvialis only. Most powerful natural antioxidant. Fat-soluble — lipid encapsulation essential.
3. Vitamin C — antioxidant, immune, collagen synthesis
4. Magnesium — electrolyte, energy, sleep, muscle function
5. Hyaluronic acid — cellular hydration retention (holds 1000x its weight in water)
6. Collagen peptides OR boswellia — joint/connective tissue (collagen if dosable in softgel, else boswellia)
7. Ashwagandha (KSM-66 preferred) — adaptogen, testosterone, energy
8. Vitamin D3 — testosterone, immune, bone health
9. Zinc — testosterone, immune, recovery
+ B12 — energy metabolism (effectively 10th core ingredient)

Key manufacturer questions: lipid encapsulation available? MOQ at 250/500? GMP + COA? Natural astaxanthin sourced? Collagen dose achievable in softgel?

## Manufacturers contacted
- **Aurinutra** (Auri Nutra Inc.) — info@aurinutra.com / (631) 454-0020. Email sent June 2026. Awaiting quote. Low MOQ specialist, GMP + UL certified, softgels confirmed. Priority.
- **Innova Nutra** — innovanutra.com. Contact form submitted June 2026. Awaiting quote. California based, West Coast logistics advantage.

## Competitive positioning
- Heliocare: only UV supplement on Amazon, targets aging women at $35-55. FORM takes same hero ingredient, builds for active men at lower price with coastal male identity.
- "Surfer supplement" keyword completely unclaimed. Remedy's Nitric Oxide Surfer has <100 reviews, weak branding.
- Reference brands: Vuori, Alo, Momentous, Seed, AG1
- Price ceiling: Heliocare $35-55. Launch FORM at $29.99, raise to $37.99 after 25 reviews.

## Brand voice
Coastal, clean, active. Confident but not bro-y. Speaks to the guy who surfs before work and trains after. Never clinical, never hype. Sits next to Vuori on a shelf at Erewhon. Top hook: "You're drinking a gallon a day and still waking up dehydrated. Here's why."

## Stack / accounts
- Amazon Seller Central (pending — open before inventory ships)
- Shopify (pending — open the week inventory ships, NOT before)
- TikTok/Instagram @formcoastal (25k followers, renamed June 2026)
- formcoastal.com (Namecheap ✅)
- Mercury business banking (pending — open TODAY under Salt Air Industries LLC EIN)
- Anthropic API key → GitHub secret: ANTHROPIC_API_KEY
- Digest email → GitHub secret: DIGEST_EMAIL
- SendGrid → GitHub secret: SENDGRID_API_KEY (add when ready)

## Google Drive reference library (owner: apsalter11@gmail.com)
- Master Brand Document v5 — company brain (always use highest version)
- FORM — Amazon Listing Copy (Ready to Launch)
- FORM — TikTok Scripts + Content Calendar (10 scripts, 4-week calendar)
- FORM — Label Design Brief
- FORM — Manufacturer Quote Evaluation Framework

## Agent roles
- **Director** (claude-opus-4-8) — assigns tasks, reviews PRs, merges safe work. Reads CLAUDE.md first every run.
- **Scout** (claude-haiku-4-5-20251001) — finds and qualifies B2B leads. Verified contacts only.
- **Writer** (claude-sonnet-4-6) — drafts outreach, TikTok scripts, Amazon copy. Humans always send.
- **Finance** (claude-haiku-4-5-20251001) — tracks API cost per run, pauses team if $20/month cap is hit.
- **Auditor** (claude-haiku-4-5-20251001) — QAs every output before it's used: accurate, on-brand, no banned claims.
