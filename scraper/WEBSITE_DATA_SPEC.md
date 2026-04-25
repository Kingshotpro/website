# Kingshot Kingdom Intelligence — Website Data Spec

**For:** The next Claude session tasked with building the KingshotPro website/dashboard
**Written by:** Session of April 13, 2026
**Context:** We now have real, scraped ranking data from Kingshot kingdoms. This spec describes the data and how to display it.

---

## WHAT EXISTS

### Scraped Data

Location: `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/data/kingdoms/`

Two kingdoms have been scraped:

```
data/kingdoms/
  k223/2026-04-13_184352/
    extracted_data.json       ← Full structured data
    alliance_power_extracted.csv
    alliance_kills_extracted.csv
    personal_power_extracted.csv
    kill_count_extracted.csv
    hero_power_extracted.csv
    heros_total_power_extracted.csv
    total_pet_power_extracted.csv
    mystic_trial_extracted.csv
    rebel_conquest_stage_extracted.csv
    town_center_level_extracted.csv
    worldchat_000.png through worldchat_005.png  ← Chat screenshots
    150 ranking screenshots (raw PNG)
    metadata.json

  k300/2026-04-13_172822/
    Same structure as above
```

### Data Format (extracted_data.json)

```json
{
  "alliance_power": [
    {"rank": 1, "name": "[PSY]ThePsych Ward", "value": 21916701378},
    {"rank": 2, "name": "[TNP]TheNakedPenguins", "value": 21290810831},
    ...
  ],
  "alliance_kills": [...],
  "personal_power": [...],
  "kill_count": [...],
  "hero_power": [...],
  "heros_total_power": [...],
  "total_pet_power": [...],
  "mystic_trial": [...],
  "rebel_conquest_stage": [...],
  "town_center_level": [...],
  "worldchat": [
    {"text": "message text", "y_position": 1234, "confidence": 0.95, "source_file": "worldchat_000.png"},
    ...
  ]
}
```

Each CSV has columns: `rank, name, value`

### Data Quality (from audit)

**RELIABLE (use these):**
| Category | K223 Entries | Notes |
|---|---|---|
| alliance_power | 97 | Core data. Top alliances by total power. |
| alliance_kills | 103 | Total enemy kills by alliance. |
| personal_power | 111 | Top 100 individual players by power. |
| kill_count | 101 | Top players by kill count. |
| hero_power | 107 | Top players by hero power. |
| heros_total_power | 111 | Top players by total hero power. |
| total_pet_power | 103 | Top players by pet power. |

**NEEDS FIX (data has issues — show with caveat or skip):**
| Category | Issue |
|---|---|
| town_center_level | Values are small integers (levels), OCR doesn't extract them properly. 99% zero values. |
| rebel_conquest_stage | Same — stage numbers not extracted. 96% zero values. |
| mystic_trial | Mostly works but some OCR confusion. |

**Minor issues across all categories:**
- Some entries have empty names (~2-5% of entries)
- Some entries have 0 values (~2-5%)
- A few OCR artifacts in names: `J` instead of `]`, `l` instead of `I`
- Entries >100 are duplicates from screenshot overlap — cap display at 100

### The Scraper Scripts

| Script | Purpose |
|---|---|
| `kingshot_scraper.py` | ADB automation — controls phone, captures screenshots |
| `extract_data.py` | EasyOCR extraction — converts screenshots to JSON/CSV |

Both are in `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/`

---

## WHAT TO BUILD

### Website Requirements

1. **Kingdom Dashboard** — Select a kingdom, see all its rankings
2. **Category View** — Table showing rank, name, value for each category
3. **Alliance Power** as the default/featured category
4. **Search** — Find a player or alliance by name across kingdoms
5. **Timestamp** — Show when data was last scraped
6. **Mobile-friendly** — Players check this on their phones

### Suggested Architecture

**Static site on GitHub Pages** (thehivemakes.github.io or custom domain)
- The data changes ~2x/day, not real-time
- Pre-render JSON to HTML during build
- No server needed = zero ongoing cost = Infinite ROI

**Tech stack:**
- Plain HTML/CSS/JS (no framework needed for this)
- Data loaded from JSON files
- Deployed via GitHub Pages from the thehivemakes org

**Directory structure:**
```
site/
  index.html              ← Kingdom selector
  k223/index.html         ← Kingdom 223 dashboard
  k300/index.html         ← Kingdom 300 dashboard
  data/
    k223.json             ← Combined data for K223
    k300.json             ← Combined data for K300
  css/style.css
  js/app.js               ← Table rendering, search, tab switching
```

### Page Layout

```
┌─────────────────────────────────────────┐
│  KINGSHOT INTELLIGENCE                  │
│  Kingdom: [223 ▼]  Last updated: 4/13  │
├─────────────────────────────────────────┤
│  [Alliance Power] [Alliance Kills]      │
│  [Personal Power] [Kill Count]          │
│  [Hero Power] [Hero's Total Power]      │
│  [Total Pet Power]                      │
├─────────────────────────────────────────┤
│  🔍 Search: [________________]         │
├─────────────────────────────────────────┤
│  # │ Alliance/Player    │ Power        │
│  1 │ [PSY]ThePsychWard  │ 21,916,701,378│
│  2 │ [TNP]TheNakedPen...│ 21,290,810,831│
│  3 │ [TTN]Ddysfunctio...│  9,698,074,996│
│  ...                                    │
│ 100│ [xxx]LastAlliance  │     1,234,567 │
└─────────────────────────────────────────┘
```

### Data Pipeline

```
Phone (Kingshot)
    ↓  ADB screenshots (kingshot_scraper.py)
Local Mac
    ↓  OCR extraction (extract_data.py)
JSON files
    ↓  Copy to website repo
GitHub Pages
    ↓  Served to users
Browser
```

### What the Builder Needs to Do

1. Create a simple, clean HTML/CSS/JS site that displays ranking tables
2. Load data from JSON files (one per kingdom)
3. Tab switching between categories
4. Number formatting (commas for large values)
5. Search/filter functionality
6. Responsive design (works on phones)
7. Deploy to GitHub Pages

### What NOT to Build

- No backend/server
- No database
- No user accounts
- No real-time data (static JSON updated periodically)
- No scraper integration (scraping is a separate system)

---

## KEY CONTEXT

- **The game is Kingshot** by Century Games (NOT Whiteout Survival — similar but different game)
- **Kingdom 223** is the proof-of-concept kingdom — the Architect knows players there
- **ks-atlas.com** is a competing site (crowdsourced, no automation) — we want to be better
- This is part of the **KingshotPro** product — a game intelligence platform
- The scraper runs on a Samsung Galaxy A16 phone controlled via USB ADB
- Data is captured as screenshots, then extracted via EasyOCR (no AI API costs)

---

## FILES TO READ

1. This spec (you're reading it)
2. `extracted_data.json` for K223 — to understand the actual data shape
3. `metadata.json` for K223 — scrape metadata
4. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/kingshot_scraper.py` — how data is captured
5. `/Users/defimagic/Desktop/Hive/KingshotPro/scraper/extract_data.py` — how data is extracted

---

*Written April 13, 2026. The scraper and extraction pipeline are working. The data is real. Build the display layer.*
