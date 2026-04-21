# Kingshot Scraping Rulebook

*Rules earned through failure. Each rule traces to at least one concrete violation — see ERROR_DIARY_*.md and SESSION_DIARY_*.md for the cost-of-failure record.*

*If you are a Claude reading this for the first time, these rules are not suggestions. Every rule exists because an earlier mind broke it and bled tokens, data, or Architect trust.*

---

## M — Measurement rules (tap coordinates)

**M1.** Every tap coordinate comes from a fresh PIL measurement of a current screenshot. No guessing, no remembering, no "about where." Catalogued coords are hints to re-verify, never absolute truth.
*(Violated 5+ times pre-compact, 1 time post-compact. Costs: wrong-row taps, phone navigated to wrong screens.)*

**M2.** Do not tap a coord derived from a single-column edge scan. At a fixed x, you see a thin slice of curved avatar edges, not the row center. Instead:
- Crop a horizontal y-strip at the candidate y and visually verify what's there.
- OR scan a wider x-range and compute the geometric center of the mass.
*(Violated tonight: scanned x=170, got 13-pixel slices, misidentified K1002's avatar edge as K1003's. Tapped K1002 instead.)*

**M3.** Card tap-targets are the card BODY (where the lord name / avatar / power display), not the header band above or the blank below. When in doubt, crop y-strips at 100px intervals to see what's where.

**M4.** Login Confirm is stable at (767, 1422) across all kingdoms. Cancel at (300, 1440). Welcome Back Confirm at (537, 1752). These are the only coordinates durable enough to reuse without re-measuring. Everything else: measure fresh.

**M5.** Promo X buttons are NOT stable. The Rookie Value Pack promo X is at (922, 429); first-purchase promo X is at (952, 363); catalogue's old (1010, 175) and (1040, 130) are from different promos. ALWAYS measure the X from the current popup.

---

## S — Scroll rules (enumeration vs. paging)

**S1.** **Enumeration scroll** (low inertia, see every row): `swipe 540,1600 → 540,1200` at duration **1200ms**. ~400px displacement, minimal fling, scroll stops near the requested endpoint.
*Use when you need to SEE every kingdom in the list — e.g., checking whether a kingdom exists.*

**S2.** **Paging scroll** (high inertia, jump pages): `swipe 540,1600 → 540,600` at duration **600ms**. Nominal 1000px but fling carries to ~1500-2000px, skipping 3-4 rows.
*Use ONLY when you already know which row you want and just need to reach it fast.*

**S3.** Never conclude a kingdom "doesn't exist on this account" from an S2 scan. Re-verify with S1. If there's a gap of 2+ contiguous kingdom-numbers where others in the sequence exist (e.g., K1000-K1002 then K1005 — where are K1003 and K1004?), the prior probability that you scrolled past them is very high.

**S4.** "Hit bottom" is only confirmed when two consecutive scroll attempts produce identical screenshots AND the bottom row has no partial-card cutoff.

---

## K — Kingdom verification rules (the "are we where we think we are" ritual)

**K1.** After every login / kingdom-switch sequence, before launching a scraper:
1. Screenshot the phone.
2. Confirm city view (Conquest / Heroes / Backpack / Shop / World tabs visible at bottom).
3. Open profile (tap avatar at ~65, 165 — re-measure if uncertain).
4. Read kingdom number from the profile panel ("Kingdom: #NNNN").
5. Confirm NNNN matches your intended target.
Back out to city view before launching the scraper.

**K2.** If the profile shows a DIFFERENT kingdom than you intended, DO NOT launch the scraper. The Architect diary Error 3 & 4 (2026-04-20) shows prior minds scraped blind on the wrong kingdom for minutes, producing corrupted data.

**K3.** For enumeration (list ALL characters on this account), use S1 enumeration scroll from top of list to bottom, taking a screenshot at each rest position. Cross-check the kingdom numbers against any prior-scrape directories on disk — disagreements mean either the account changed or your enumeration missed a row.

**K4.** Never claim "X doesn't exist" until you've done K3 and also sanity-checked against on-disk evidence. If prior-scrape data exists for a kingdom, the presumption is that kingdom was on SOME account recently — either this account or a different one. Verify before concluding.

---

## C — Collaboration rules (multi-Claude, multi-process)

**C1.** Before launching ANY background scraper or extractor process, run:
```
ps aux | grep -E 'kingshot_scraper|extract_data|scrape_account|batch_loop|extract_loop'
```
If any match, you must understand it before proceeding.

**C2.** For every foreign process found:
- `ps -o pid,ppid,etime,command -p <PID>` — what is it, how long has it been running.
- Walk the PPID chain to the root. If the root is `claude.app/.../claude --...`, it's another Claude session. Read any shell script in the chain.

**C3.** Never kill another Claude's work without Architect approval. Kill your OWN duplicate if overlapping. Signal: when you see two processes with identical command args but different PPIDs, one of them is yours; find out which.

**C4.** The `extract_loop.sh` (if present) polls every 60s and extracts any 2026-MM-DD snapshot dir with ≥100 pngs and no `alliance_power_extracted.csv`. If it's running, you do NOT need to launch manual extractions — just wait. Kill the loop only when the specific kingdoms it waits on will never appear (e.g., K1003/K1004 on an account that doesn't have them).

---

## P — Popup dismissal rules

**P1.** The post-login popup chain is variable in composition but fixed in order of possibilities: Rookie Value Pack / first-purchase promo → Welcome Back → Teleport Confirmation → other event promos. Each must be dismissed before city view is reached.

**P2.** Screenshot BEFORE each dismissal tap. Blind-tapping catalogued coords when no popup is present can tap through to underlying UI and open an unintended screen (e.g., tapping (540, 1800) with no Welcome Back popup can tap the world-map button).

**P3.** Signature recognition (the "don't measure what you already know" exception):
- Orange button + Cyan button at y≈1440, no avatar between them = Login dialog (Cancel 300,1440 / Confirm 767,1422) OR Quit Game dialog (Cancel 300,1440 / Confirm if intended).
- Green "Confirm" button centered at y≈1752 with Time Offline bar above = Welcome Back.
These are reflexive — tap without re-measurement IF the full signature matches. If ANY element deviates, measure fresh.

---

## V — Verification rules (pre-scrape, post-scrape, monitor)

**V1.** **Pre-scrape checklist** (do all four):
1. Phone is on city view (not profile, not map, not battle).
2. Profile kingdom number matches intended target (rule K1).
3. `ps aux | grep kingshot_scraper` shows no other scraper running.
4. Scraper command args kingdom number matches intended target.

**V2.** **Post-scrape verification**:
1. `ls data/kingdoms/k<N>/<ts>/*.png | wc -l` ≥ 100 (typical 149-156).
2. `ls data/kingdoms/k<N>/<ts>/ | sed 's/_[0-9]*\.png//' | sort -u` shows all 10 category names + `worldchat` + `scrape_log.txt`.
3. Log contains `Kingdom <N> COMPLETE`.

**V3.** **Monitor grep filter**: match the literal success marker `Kingdom <N> COMPLETE` — NOT "Scrape Complete" or "=== Complete" (those don't appear). Always include error signatures: `Traceback|FATAL|Killed|Lost leaderboard`. If you write a narrower filter, successful completions will show as "EXITED_UNCLEAN" and you'll waste cycles re-verifying.

**V4.** `ls data/kingdoms/k<N>/<ts>/extracted_data.json` existence means OCR is done. Loop or manual extraction writes this file last.

---

## A — Anti-assumption rules (epistemic discipline)

**A1.** "X doesn't exist" is a strong claim requiring positive evidence. One negative scan is not evidence of absence — especially if the scan was fast (S2) or if the conclusion would require 2+ adjacent items to be missing from an otherwise-contiguous sequence.

**A2.** When the Architect's prior probability disagrees with mine ("that is unlikely"), the prior is usually right. Re-verify before defending my position. Architect has ground-truth access; I have screenshot-samples.

**A3.** "Process running with progressing log lines" ≠ "process doing the right thing." The scraper has no UI introspection — it swipes at fixed coords regardless of what screen is in front of it. Always re-verify by screenshot when Architect says "that doesn't look right" or when work is mysteriously slow.

**A4.** "I already did this" → check the filesystem, not my memory. If my memory says "K1002 is extracted," verify with `ls extracted_data.json`. Memory decays across tool calls; disk doesn't.

---

## T — Token / cadence rules (Architect's "space out monitoring")

**T1.** Never screenshot after every tap during a scrape. The scraper is running on its own — polling the phone with fresh screenshots burns tokens for no gain.

**T2.** Use `Monitor` with tight terminal-state filters (rule V3) — it only fires events on transitions worth acting on. Sleeping between events is free.

**T3.** For ~30min scrapes + ~25min extractions, the right cadence is 1-2 status reports per kingdom, not one per phase. Each phase-level report costs tokens that should go to decision-making.

**T4.** When Architect requests a "status update", output a structured table of what's running + what's queued + what's done — not a narrative of the last action.

---

## R — Ritual summary (the pre-scrape sequence in order)

Given: target kingdom K, phone on current kingdom's city view.

1. `ps aux | grep kingshot_scraper` (rule C1)
2. Tap avatar (~65, 165) → profile
3. Tap Settings (~945, 2270) → settings panel
4. Tap Characters (~370, 555) → characters list
5. Enumerate to find K using S1 scrolls (rule S1)
6. Measure target row center — crop-and-verify (rule M2-M3)
7. Tap row center
8. Verify Login dialog shows correct lord ID (K2)
9. Tap Login Confirm (767, 1422) (M4)
10. `python3 -c "import time; time.sleep(20)"` — the 18s wait is sacred
11. Screenshot → measure and dismiss each popup in order (P1-P3)
12. Verify city view reached; verify power value roughly matches character list
13. **Re-open profile and verify kingdom number = K** (K1 — this is the step that was missing from prior minds' rituals; add it)
14. Back to city view
15. Launch: `python3 kingshot_scraper.py --scrape --kingdom K --yes --skip-audit > /tmp/kingshot_session/k${K}_scrape.log 2>&1 &`
16. Arm Monitor with rule V3 filter
17. Wait for terminal event; verify post-scrape per V2
