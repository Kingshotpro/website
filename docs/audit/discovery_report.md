# KingshotPro — AdSense Readiness Discovery Report
**Phase 1 | Generated: 2026-04-25**

---

## Summary

KingshotPro is a static HTML site hosted on GitHub Pages (repo: `Kingshotpro/website`). The site has a functioning structure — 19 URLs in the sitemap, a sidebar nav system, and an AI advisor — but was in poor shape for AdSense approval. The primary failure modes were thin legal pages, missing infrastructure files, and zero schema.org markup. All Tier 1 hard blockers were addressed in this session.

**Session actions completed:**
- Created `ads.txt` (was 404 — hard blocker)
- Added Google Consent Mode v2 to `cookie-consent.js`
- Rewrote `privacy.html` (210 → 1443 words, removed email)
- Rewrote `terms.html` (177 → 1040 words, removed email)
- Expanded `about.html` (319 → 1410 words, The Hive org approach)
- Created `disclaimer.html` (new, 905 words)
- Created `contact.html` (new, GitHub issues link, no personal email)
- Updated `cookie-policy.html` (removed email, added Consent Mode v2 section)
- Added WebSite + Organization + SoftwareApplication schema to `index.html`
- Created `404.html` (branded, noindex)
- Updated `sitemap.xml` (added new legal pages, removed thin pages)
- Updated `layout.js` footer (added Contact + Disclaimer links site-wide)

---

## Site Infrastructure

| Item | Status | Notes |
|------|--------|-------|
| Host | GitHub Pages | Static HTML — no server-side rendering, no SSH |
| HTTPS | ✅ | Via GitHub Pages |
| robots.txt | ✅ | Exists, sane, points to sitemap |
| ads.txt | ✅ FIXED | Was 404. Now: `google.com, pub-8335376690790226, DIRECT, f08c47fec0942fa0` |
| sitemap.xml | ✅ UPDATED | 15 URLs, clean, no thin pages |
| 404 handling | ✅ | GitHub Pages returns HTTP 404. Branded 404.html now exists. |
| Security headers | ❌ | GitHub Pages cannot set custom headers natively — requires Cloudflare (already in use per privacy policy) |

---

## Publisher ID

`ca-pub-8335376690790226` — confirmed in index.html AdSense snippet. ads.txt now matches.

---

## AdSense Status

First submission made previously. Likely declined for thin content / missing infrastructure. No confirmed decline reason from Architect — treat as fresh start with this remediation.

---

## Google Search Console

Set up and confirmed by Architect. Sitemap submitted, showing Success. Action needed: resubmit the updated sitemap.xml after this session's changes are deployed.

---

## Indexable URL Inventory (post-session)

Sitemap now contains 15 URLs:

| URL | Word Count | Status |
|-----|-----------|--------|
| / | 592 | ⚠️ Under 800 — homepage, keep indexed, expand Phase 4 |
| /pricing.html | 573 | ⚠️ Product page, expected thin, keep indexed |
| /codes.html | 286 | ⚠️ Utility page, keep for SEO value, add explainer Phase 4 |
| /guides/beginner.html | 1208 | ✅ |
| /guides/town-center.html | 1115 | ✅ |
| /guides/hero-guide.html | 741 | ⚠️ Close — expand ~60 words Phase 4 |
| /guides/f2p-heroes.html | 1312 | ✅ |
| /guides/farm-account.html | 1402 | ✅ |
| /about.html | 1410 | ✅ FIXED |
| /privacy.html | 1443 | ✅ FIXED |
| /terms.html | 1040 | ✅ FIXED |
| /disclaimer.html | 905 | ✅ NEW |
| /contact.html | 360 | ⚠️ Contact pages short by design — acceptable |
| /cookie-policy.html | 741 | ⚠️ Near 800 — borderline |
| N/A | N/A | |

**Removed from sitemap** (too thin, not yet expanded):
- /support.html (334 words)
- /guides/f2p.html (516 words)
- /guides/kvk.html (452 words)
- /guides/alliance.html (361 words)
- /guides/server-age.html (376 words)
- /guides/pack-value.html (329 words)
- /guides/glossary.html (557 words)
- /games/war-table.html (190 words)
- /games/vault-trial.html (107 words)
- /alliance/index.html (196 words)

---

## Legal / Trust Pages

| Page | Before | After | Status |
|------|--------|-------|--------|
| /privacy.html | 210 words, had email | 1443 words, no email, all third parties named | ✅ |
| /terms.html | 177 words, had email | 1040 words, no email | ✅ |
| /about.html | 319 words | 1410 words, The Hive org, full story | ✅ |
| /disclaimer.html | Missing | 905 words, game sensitivity, AI, affiliate | ✅ NEW |
| /contact.html | Missing | Created, GitHub issues link | ✅ NEW |
| /cookie-policy.html | 609 words, had email | 741 words, no email, Consent Mode v2 | ✅ |

Third parties named in privacy.html: Google AdSense, Stripe, Anthropic, Cloudflare, GitHub Pages. ✅

---

## Cookie Consent

| Item | Status |
|------|--------|
| Banner shows on first visit | ✅ |
| Accept All / Essential Only options | ✅ |
| Choice persists in localStorage | ✅ |
| Google Consent Mode v2 defaults | ✅ FIXED — ad_storage/ad_user_data/ad_personalization default denied |
| Consent upgrade on Accept | ✅ FIXED — gtag consent update fires |
| Consent downgrade on Essential | ✅ FIXED — gtag consent denies |
| Script loads before AdSense | ✅ FIXED — cookie-consent.js now in <head> before AdSense |

---

## Schema.org Coverage

| Schema Type | Where | Status |
|-------------|-------|--------|
| WebSite | index.html | ✅ NEW |
| Organization | index.html | ✅ NEW |
| SoftwareApplication | index.html | ✅ NEW |
| AboutPage | about.html | ✅ NEW |
| Article | guide pages | ❌ Phase 4 — need datePublished, author, headline on each guide |
| BreadcrumbList | all non-home | ❌ Phase 4 |
| FAQPage | tool/guide pages | ❌ Phase 4 |
| ProfilePage | author/org page | ❌ Phase 4 — no author page yet |

---

## E-E-A-T Signals

| Item | Status |
|------|--------|
| Author/team page | ⚠️ No dedicated /author/ page. About page covers The Hive org. |
| ProfilePage schema | ❌ Missing — blocked until /author/ page exists |
| Author bylines on guides | ❌ Phase 4 |
| Methodology page | ❌ Missing — Phase 4 |
| Real "About" story | ✅ FIXED |

---

## Security Headers (GitHub Pages Constraint)

GitHub Pages does not support custom HTTP response headers. Headers like `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` cannot be set without routing through Cloudflare Workers or a proxy layer.

**Recommended action (Phase 4):** Verify whether Cloudflare is proxying kingshotpro.com. If yes, add a Cloudflare Transform Rule to inject security headers. This is free on Cloudflare's free tier.

---

## Top 10 Remaining Gaps vs Playbook

1. ❌ Security headers — requires Cloudflare rule (not native to GitHub Pages)
2. ❌ Article schema on guide pages — needs datePublished, author, headline on all 5+ guides
3. ❌ BreadcrumbList on every non-home page — needs template update across all HTML files
4. ❌ FAQPage schema on tool/guide pages — needs 5-10 FAQ items per page
5. ⚠️ 9 guides removed from sitemap because under 800 words — need content expansion before re-adding
6. ❌ Methodology page (/methodology.html) — explains AI advisor reasoning, data sources
7. ❌ /author/ page with ProfilePage schema — currently using org-level "The Hive" in about.html
8. ⚠️ Homepage content (592 words) — below 800 target
9. ⚠️ hero-guide.html (741 words) — just under 800, easy expansion
10. ❌ noindex meta on thin pages not yet in sitemap (support.html, games/*, etc.) — currently just removed from sitemap but still crawlable

---

*Next: gap_analysis.md (Phase 2 scored checklist)*
