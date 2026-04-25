# KingshotPro — AdSense Approval Tracker
*Created: 2026-04-25 (reconstructed after context compaction)*

---

## DONE — Completed across Sessions 1–5

### Content (guides)
- [x] `guides/beginner.html` — 800+ words, schema, byline, cookie-consent order fixed
- [x] `guides/town-center.html` — 800+ words, schema, byline, cookie-consent order fixed
- [x] `guides/hero-guide.html` — expanded to 1050+ words, schema, byline, cookie-consent order fixed
- [x] `guides/f2p-heroes.html` — 800+ words, schema, byline, cookie-consent order fixed
- [x] `guides/farm-account.html` — 800+ words, schema, byline, cookie-consent order fixed
- [x] `guides/glossary.html` — expanded to 950+ words (22 new terms), schema, cookie-consent order fixed, trailing text removed
- [x] `guides/f2p.html` — full rewrite, 1000+ words, schema, correct scripts, standard footer
- [x] `guides/kvk.html` — full rewrite, 1200+ words, schema, correct scripts, standard footer
- [x] `guides/alliance.html` — full rewrite, 1200+ words, schema, correct scripts, standard footer
- [x] `guides/server-age.html` — full rewrite, 1100+ words, schema, correct scripts, standard footer
- [x] `guides/pack-value.html` — full rewrite, 1100+ words, schema, correct scripts, standard footer

### New pages
- [x] `games/index.html` — Games hub, 800+ words, schema, cookie-consent correct
- [x] `games/oath-and-bone-chronicle.html` — Original story content, portraits, schema
- [x] `methodology.html` — 900+ words, E-E-A-T trust page, data sources, accuracy table

### Games — thin content fixed
- [x] `games/vault-trial.html` — Added "About The Vault Trial" section (300+ words static HTML below game div). Crawler-visible without JS.
- [x] `games/war-table.html` — Added "About The War Table" section (350+ words static HTML below game div). Explains matchup reading, troop tier logic, buff evaluation, scoring.
- [x] `games/orbit.html` — Restructured layout (canvas now in `.orbit-stage` div; `overflow:hidden` moved off body so content scrolls). Added "About Kingdom Orbit" section (250+ words). Crawler now sees visible text.

### Cookie-consent load order fixed (must be BEFORE AdSense)
- [x] `index.html`
- [x] `about.html`
- [x] `codes.html`
- [x] `pricing.html`
- [x] `privacy.html`
- [x] `terms.html`
- [x] `disclaimer.html`
- [x] `contact.html`
- [x] `heroes.html`
- [x] All 11 guide pages above
- [x] 31 `calculators/*.html` files — batch fixed 2026-04-25
- [x] 29 `heroes/*/index.html` files — batch fixed 2026-04-25
- [x] 33 `kingdoms/*/index.html` files — batch fixed 2026-04-25
- [x] 21 remaining pages (games stubs, worldchat, players, alliance/, etc.) — batch fixed 2026-04-25
- [x] Python verification sweep — 0 remaining violations confirmed

### Infrastructure
- [x] `sitemap.xml` — all expanded guides + games + methodology added
- [x] `js/layout.js` — methodology added to footer policy nav (appears site-wide)
- [x] `js/layout.js` — GAMES section added to sidebar nav
- [x] `index.html` — Strategy Guides section added (9 guide cards, substantial text)

### File hygiene
- [x] `guides/furnace.html` — Tombstone comment added. noindexed redirect to town-center.html. Not in sitemap.
- [x] `docs/NAMING_CONVENTIONS.md` — Created. Documents tombstone pattern + wrong-game contamination rule.

---

## REMAINING — Must Do Before Resubmitting AdSense

### Priority 1 — Blocking

- [ ] **Deploy** — All changes are local only. Nothing above matters until committed and pushed to GitHub Pages. Do NOT score readiness until deployed.

### Priority 2 — Architect actions (cannot be done from HTML)

- [ ] **Security headers** — `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`. Requires Cloudflare Transform Rules. Architect action.
- [ ] **GSC sitemap resubmission** — After deploy: submit `https://kingshotpro.com/sitemap.xml` in Google Search Console. Architect action.

### Priority 3 — Nice to Have (not blockers)

- [ ] **FAQPage schema on homepage** — Adds structured rich result eligibility.
- [ ] **cookie-policy.html cookie-consent order** — Low-traffic page, in the sitemap.

---

## WHAT CANNOT BE SCORED UNTIL DEPLOYED

The previous score (whatever it was) was a pre-deploy estimate. Real AdSense readiness cannot be confirmed until:
- The live site reflects all changes
- Consent Mode v2 is verified firing in Google Tag diagnostics
- At least one crawl has happened with the new sitemap submitted

---

## KNOWN NON-ISSUES

- `support.html` — 565 words but NOT in sitemap and NOT linked from nav (commented out). Orphaned from Google's perspective. Not a concern.
- `guides/furnace.html` — Tombstone redirect, noindexed. Not in sitemap. Correctly handled.

---

*Last updated: 2026-04-25 (Session 5)*
