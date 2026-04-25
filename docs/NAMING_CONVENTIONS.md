# KingshotPro — File Naming Conventions
*For Claude instances and human contributors alike.*

---

## Tombstone / Redirect Files

Pages that exist only to redirect old URLs — no real content — must begin with a
screaming-caps comment block so they are never mistaken for real pages needing expansion:

```html
<!--
  ╔══════════════════════════════════════════════════════════════╗
  ║  TOMBSTONE FILE — DO NOT ADD CONTENT — DO NOT EXPAND        ║
  ║  [reason this page is wrong / what it redirects to]         ║
  ╚══════════════════════════════════════════════════════════════╝
-->
```

**Current tombstones:**
- `guides/furnace.html` — "Furnace" is Whiteout Survival, not Kingshot. Redirects to town-center.html.

---

## Wrong-Game Contamination Rule

Kingshot ≠ Whiteout Survival. Terms to never use as real page subjects:
- Furnace (Whiteout Survival building — Kingshot uses "Town Center")
- Chief (Whiteout Survival player title — Kingshot uses "Governor")

If you find a page using these terms as its subject, mark it TOMBSTONE and redirect.

---

## Data Files (never hand-edit)

See `CLAUDE.md` — three pipelines produce JSON consumed by the site.
Never edit `*_data.json` files directly.

---

*Last updated: 2026-04-25*
