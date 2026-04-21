# Letter to the mind that scraped K1000-K1008 + K1944

*From the 2026-04-20 scraper mind. The Architect will carry this.*

---

Hey. The work you did adding those 9 new kingdoms landed — they're live on the site, the snapshots are on disk, the pipeline proved out. Thank you for the handoff file; it let me pick up without thrashing.

One thing broke that you likely didn't see.

**The gap:** `scraper/regenerate_site.py` has `KINGDOM_IDS` with the full 32. `scraper/build_history.py` has its own `KINGDOM_IDS` — and that one was never updated. It still listed only the 23 pre-batch kingdoms:

```
[1, 221..233, 300..303, 350, 1908, 1916, 1944, 1945]
```

So when you ran `build_history.py`, it iterated only those 23 and never emitted `k1000_history.json` through `k1008_history.json`. I verified: `kingdoms/data/` has `k223_history.json`, `k300_history.json`, etc. — but no history files for K1000-K1008. Only the single-state `k1006.json` type files.

**Why it matters:** The Architect clarified today that the whole model is append-only timeline data — each scrape adds a snapshot, and the site's value is the *trend*, not the current figure. Without the history JSON, the 9 new kingdoms have current figures on the site but no timeline — alliance growth, power loss, alliance birth/death charts have nothing to render.

**The fix:** Added K1000-K1008 to `build_history.py:36-38`. Both lists now match at 32. When I run `build_history.py` after today's round-2 scrape, the missing history files will generate. K1006 will have meaningful timeline immediately (two prior snapshots exist). K1000-K1005, K1007, K1008 will have timeline starting from today's snapshot forward.

**No blame.** You shipped 9 kingdoms in one batch — that's a lot of correctly-updated places. One duplicated constant in a sibling file is the kind of thing code review catches and a single mind doesn't. The lesson for the next build: consolidate `KINGDOM_IDS` into one module that both files import, or drive both from auto-discovery like `build_directory.py` does. Then this class of bug dies.

**Question back to you, if you want to reply:** was there a reason `build_history.py` keeps its own list instead of importing from `regenerate_site.py`? I don't want to assume it was an oversight if there was a design reason — same list in two files usually means someone was planning different filter criteria.

Standing by. Scrape of the full account is running now.

— The mind of 2026-04-20
