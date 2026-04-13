# KingshotPro — Naming Research Results
*Signal, April 9, 2026 — Research delegated to Perplexity*

---

## Part 1: The AI Advisor Character Name

### Top 3 Recommendations

**#1 — The Chancellor**
- Highest recognition among 25-34 male gamers (Crusader Kings, Warcraft III, Game of Thrones "Hand of the King")
- Implies authority and political mastery — fits "personalized kingdom strategy advice"
- No cultural baggage — universally Western medieval
- "The Chancellor says..." works naturally in UI

**#2 — The Sage**
- Strong fantasy archetype — wise mentor who knows things you don't
- Mystical but approachable — good fit for an AI that "sees your account"
- Popular in games: Dragon Age, Warcraft, Elder Scrolls
- "The Sage advises..." works well

**#3 — The Vizier (original working name)**
- Exotic flair differentiates from generic fantasy titles
- Proven in game contexts (Civilization series, Crusader Kings)
- Cultural assessment: Arabic/Ottoman origin. Perplexity found no backlash for fantasy game use. Strategy games routinely blend cultural elements. Low risk but not zero.
- "The Vizier suggests..." has character

### What Competitors Do

No major mobile strategy game has a named, persistent AI chat advisor. Rise of Kingdoms has generic tutorials. Lords Mobile has unnamed helpers. This is genuinely novel — nobody to copy from, but also nobody to be compared against unfavorably.

### Names Rated "Boring" by Gamer Audience
- Steward (administrative drudge)
- Chamberlain (stuffy/servile)
- Lorekeeper (bookish, passive)
- Scribe (clerk-like)
- Counselor (sounds like a therapist)

### My Take
**Chancellor** is safest and most recognizable. **Sage** has the most character. **Vizier** is the most distinctive but carries a small cultural question mark with a global audience (US, Brazil, Indonesia, Vietnam, Turkey, Germany).

For a product that wants to feel different from everything else in this space: **Sage** has the best balance of recognition + mystique + warmth. "The Sage knows your account" hits differently than "The Chancellor knows your account."

---

## Part 2: Spending Tier Labels

### How Players Self-Identify

- **F2P**: Badge of pride. Players say "I'm F2P" with genuine pride — it signals skill over wallet. DO NOT change this label.
- **Dolphin**: Community term for $1-$500 range. Neutral, sometimes dismissive.
- **Whale**: Community-owned. Top spenders often wear it proudly ("whale life"). But it CAN feel reductive when shown by a tool rather than self-identified.
- **Low spender**: Dismissive. Nobody wants to be called "low" anything.

### Recommended System: Medieval Titles

| Spend Range | Label | Why It Works |
|-------------|-------|-------------|
| $0 (never spent) | **F2P** | Keep it. Community badge. Players love it. |
| $1–$99 | **Knight** | Honors modest investment as heroic. "Knight" = valor, loyalty. Nobody feels bad being called a Knight. |
| $100–$499 | **Baron** | Noble, prestigious. Positions mid-spenders as leaders without overshadowing higher tiers. |
| $500+ | **Lord** | Elite but collaborative. Dignified. Replaces "whale" with a title that feels earned, not labeled. |

### Alternative: If We Can't Detect Spending

If the API doesn't return spending data (see diary — this is unverified), use game-stage labels instead:

| Furnace Range | Label |
|---------------|-------|
| 1–14 | **Newcomer** |
| 15–21 | **Veteran** |
| 22–27 | **Elite** |
| 28+ | **Legend** |

This works with only furnace level (which may also require manual input — testing needed).

### Example Greetings

With spending data:
> "Welcome back, DragonSlayer. You are a **Knight** on a 90-day server — lead your allies to glory."

Without spending data (furnace only):
> "Welcome back, DragonSlayer. You are a **Veteran** in Kingdom 734."

With manual entry:
> "Welcome back, DragonSlayer. You told us you're a **Baron** — here's what matters for you right now."

### Cultural Note for Global Audience

The medieval titles work across cultures better than English-specific terms. "Knight," "Baron," and "Lord" are recognized gaming vocabulary worldwide thanks to RPGs and strategy games. Turkish, Brazilian, Indonesian, Vietnamese, and German players will understand these through gaming context even if they're not native English terms.

---

## Decisions for the Architect

1. **Character name:** Chancellor, Sage, or Vizier?
2. **Tier labels:** F2P / Knight / Baron / Lord — approved?
3. **Fallback if no spending data from API:** Use furnace-based labels (Newcomer/Veteran/Elite/Legend) or ask players to self-classify?

---

*Research sourced from Perplexity (2 queries, April 9, 2026). Cross-referenced against gaming community terminology from Reddit, Discord, and gaming analytics platforms.*
