#!/usr/bin/env python3
"""
Generate individual hero pages + directory index + comparison + companion pages.
Run from the KingshotPro root: python3 heroes/generate_pages.py
"""
import json, os, re

# ── HERO DATA (mirrors heroes.js exactly) ──
HEROES = [
    {"name":"Amadeus","gen":1,"rarity":"legendary","troop":"infantry","rally":"S","garrison":"B","bear":"S","joiner":"A","f2p":False,"vip":True,"bestUse":"Rally lead & bear hunt (VIP hero)","desc":"One of the strongest offensive heroes in the game. His first skill provides dependable rally value. Remains S-tier for rallies across all generations. Amadeus is a VIP hero \u2014 access is gated behind VIP progression, which in practice requires spending to reach quickly.","tags":["rally-lead","bear","offensive","long-term","vip"]},
    {"name":"Jabel","gen":1,"rarity":"legendary","troop":"cavalry","rally":"B","garrison":"S","bear":"B","joiner":"-","f2p":True,"bestUse":"Garrison defender","desc":"The foundational garrison tank. Extremely robust and available early. Core of any defensive lineup from day one through late game.","tags":["garrison","defensive","f2p-friendly","tank"]},
    {"name":"Helga","gen":1,"rarity":"legendary","troop":"infantry","rally":"A","garrison":"B","bear":"B","joiner":"-","f2p":False,"bestUse":"Early rally alternative","desc":"A decent early offensive hero who serves as an Amadeus alternative. Falls off in later generations as stronger rally leads become available.","tags":["rally-lead","offensive","early-game"]},
    {"name":"Saul","gen":1,"rarity":"legendary","troop":"archer","rally":"B","garrison":"A","bear":"B","joiner":"S","f2p":True,"bestUse":"Garrison joiner & stacking","desc":"An S-tier joiner for garrison defense via stacking. Also invaluable for F2P players due to construction speed boosts. Dual-purpose hero: city management and garrison.","tags":["garrison","joiner","stacking","f2p-friendly","construction"]},
    {"name":"Zoe","gen":2,"rarity":"legendary","troop":"infantry","rally":"B","garrison":"S","bear":"-","joiner":"-","f2p":True,"bestUse":"F2P garrison tank","desc":"The F2P garrison MVP. Remains viable well into Gen 5-6 with proper support. Her defensive capabilities, damage reduction, and crowd control are unmatched for free players.","tags":["garrison","defensive","f2p-friendly","tank","long-term"]},
    {"name":"Hilde","gen":2,"rarity":"legendary","troop":"cavalry","rally":"B","garrison":"S","bear":"A","joiner":"S","f2p":False,"bestUse":"Garrison joiner & healer","desc":"A dedicated healer who can also disable enemies briefly. One of the best healers in the game. S-tier joiner for garrison stacking.","tags":["garrison","joiner","stacking","healer","support"]},
    {"name":"Marlin","gen":2,"rarity":"legendary","troop":"archer","rally":"S","garrison":"B","bear":"B","joiner":"-","f2p":True,"bestUse":"Long-term archer carry","desc":"Excellent ranged damage dealer. A long-term F2P investment — aim for 465 shards to reach 4-stars quickly when available. Excels in both PvE and PvP, powerful in arena and expedition.","tags":["rally-lead","offensive","f2p-friendly","long-term","arena"]},
    {"name":"Petra","gen":3,"rarity":"legendary","troop":"cavalry","rally":"S","garrison":"B","bear":"B","joiner":"-","f2p":True,"bestUse":"Cavalry rally lead","desc":"The premier cavalry rally lead. Often featured in Hero Roulette events, making her accessible to F2P players. Flexible hero that excels on offense.","tags":["rally-lead","offensive","cavalry","f2p-friendly"]},
    {"name":"Eric","gen":3,"rarity":"legendary","troop":"infantry","rally":"B","garrison":"S","bear":"B","joiner":"-","f2p":False,"bestUse":"Garrison defender","desc":"A solid garrison infantry defender who joins the defensive rotation. Reliable but not as impactful as Zoe for F2P players.","tags":["garrison","defensive"]},
    {"name":"Jaeger","gen":3,"rarity":"legendary","troop":"archer","rally":"B","garrison":"S","bear":"B","joiner":"-","f2p":False,"bestUse":"Garrison archer","desc":"Garrison-oriented archer who strengthens defensive lineups. Lower priority for F2P players compared to Marlin.","tags":["garrison","defensive"]},
    {"name":"Rosa","gen":4,"rarity":"legendary","troop":"archer","rally":"A","garrison":"B","bear":"B","joiner":"-","f2p":False,"bestUse":"Arena specialist","desc":"Strong offensive archer and arena specialist. Accessible through specific events. Only invest if you see a clear path to consistent shard collection.","tags":["rally-lead","offensive","arena"]},
    {"name":"Alcar","gen":4,"rarity":"legendary","troop":"infantry","rally":"B","garrison":"S","bear":"A","joiner":"-","f2p":False,"bestUse":"Garrison infantry","desc":"Premium garrison infantry defender. Strong in garrison and bear hunt but typically requires significant investment.","tags":["garrison","defensive","bear"]},
    {"name":"Margot","gen":4,"rarity":"legendary","troop":"cavalry","rally":"B","garrison":"S","bear":"S","joiner":"A","f2p":False,"bestUse":"Garrison & bear joiner","desc":"Excels in garrison defense and bear hunt. A strong joiner who adds depth to both defensive and PvE lineups.","tags":["garrison","joiner","bear","defensive"]},
    {"name":"Vivian","gen":5,"rarity":"legendary","troop":"archer","rally":"S+","garrison":"B","bear":"S","joiner":"S","f2p":False,"bestUse":"Army-wide damage buff","desc":"One of the most impactful heroes in the game. Provides army-wide damage buffs that elevate entire rally lineups. S+ tier for rallies.","tags":["rally-lead","offensive","bear","joiner","buff","long-term"]},
    {"name":"Thrud","gen":5,"rarity":"legendary","troop":"cavalry","rally":"S","garrison":"A","bear":"B","joiner":"-","f2p":False,"bestUse":"Cavalry multiplier","desc":"A powerful cavalry multiplier who amplifies cavalry-heavy rally compositions. Strong on offense with some garrison flexibility.","tags":["rally-lead","offensive","cavalry"]},
    {"name":"Long Fei","gen":5,"rarity":"legendary","troop":"infantry","rally":"A","garrison":"S","bear":"A","joiner":"-","f2p":False,"bestUse":"Garrison infantry","desc":"Late-game garrison infantry specialist. Strong across garrison and bear hunt. A premium investment for defensive players.","tags":["garrison","defensive","bear"]},
    {"name":"Yang","gen":6,"rarity":"legendary","troop":"archer","rally":"S+","garrison":"B","bear":"S","joiner":"-","f2p":True,"bestUse":"F2P rally carry","desc":"The F2P late-game MVP. Provides significant rally impact and is accessible through challenging events, alliance activities, and daily play. Prioritize saving shards for Yang from Gen 5 onward.","tags":["rally-lead","offensive","f2p-friendly","long-term"]},
    {"name":"Sophia","gen":6,"rarity":"legendary","troop":"cavalry","rally":"S","garrison":"A","bear":"B","joiner":"-","f2p":False,"bestUse":"Confusion-based debuffer","desc":"A cavalry debuffer who disrupts enemy formations with confusion effects. Strong rally presence with some garrison capability.","tags":["rally-lead","offensive","cavalry","debuff"]},
    {"name":"Triton","gen":6,"rarity":"legendary","troop":"infantry","rally":"A","garrison":"S","bear":"A","joiner":"-","f2p":False,"bestUse":"Garrison infantry","desc":"The strongest frontline unit in Gen 6. Dominates garrison defense and is a solid bear hunt contributor.","tags":["garrison","defensive","bear","tank"]},
    {"name":"Chenko","gen":1,"rarity":"epic","troop":"cavalry","rally":"-","garrison":"-","bear":"S","joiner":"S","f2p":True,"bestUse":"Best F2P rally joiner","desc":"His first skill provides dependable rally value — considered the best rally joiner skill for F2P players. Essential for bear hunt participation.","tags":["joiner","bear","f2p-friendly","long-term"]},
    {"name":"Amane","gen":1,"rarity":"epic","troop":"archer","rally":"-","garrison":"-","bear":"S","joiner":"S","f2p":True,"bestUse":"Offensive stacking joiner","desc":"An excellent offensive stacking joiner for bear hunt and rallies. Pairs well with archer-heavy compositions.","tags":["joiner","bear","stacking","f2p-friendly"]},
    {"name":"Yeonwoo","gen":1,"rarity":"epic","troop":"archer","rally":"-","garrison":"-","bear":"S","joiner":"S","f2p":True,"bestUse":"Non-chance offensive joiner","desc":"A reliable joiner whose offensive contribution does not rely on chance mechanics. Consistent value in rally and bear hunt.","tags":["joiner","bear","f2p-friendly"]},
    {"name":"Gordon","gen":1,"rarity":"epic","troop":"cavalry","rally":"B","garrison":"-","bear":"-","joiner":"A","f2p":True,"bestUse":"Early-game reliable","desc":"A reliable early-game hero who provides decent value until stronger options become available.","tags":["early-game","f2p-friendly","joiner"]},
    {"name":"Howard","gen":1,"rarity":"epic","troop":"infantry","rally":"-","garrison":"B","bear":"-","joiner":"-","f2p":True,"bestUse":"Garrison only","desc":"Limited utility — garrison only. Quickly outclassed by Gen 2+ heroes. Low priority for investment.","tags":["garrison","early-game","f2p-friendly"]},
    {"name":"Quinn","gen":1,"rarity":"epic","troop":"archer","rally":"-","garrison":"-","bear":"-","joiner":"-","f2p":True,"bestUse":"Low priority","desc":"Low boost value with limited combat utility. Not recommended for significant investment.","tags":["f2p-friendly","early-game"]},
    {"name":"Diana","gen":1,"rarity":"epic","troop":"archer","rally":"-","garrison":"-","bear":"-","joiner":"-","f2p":True,"bestUse":"Gathering (no battle skills)","desc":"No battle skills — she is a gathering hero only. Useful for resource farming with farm accounts but has zero combat value.","tags":["gathering","f2p-friendly","farm"]},
    {"name":"Fahd","gen":1,"rarity":"epic","troop":"cavalry","rally":"-","garrison":"-","bear":"D","joiner":"B","f2p":True,"bestUse":"Low priority joiner","desc":"Very low priority. Only use if you have absolutely no other joiner options. Quickly outclassed.","tags":["f2p-friendly","early-game"]},
]

LINEUPS = {
    "f2p_early":       {"label":"F2P Early Game (Gen 1-2)","heroes":["Jabel","Zoe","Marlin","Chenko","Saul"],"note":"Jabel + Zoe for garrison. Marlin for offense. Chenko for rally joining. Saul for construction speed + garrison stacking."},
    "f2p_mid":         {"label":"F2P Mid Game (Gen 3-4)","heroes":["Zoe","Marlin","Petra","Chenko","Saul"],"note":"Add Petra as cavalry rally lead. Zoe and Marlin remain core. Start saving shards for Gen 6 Yang."},
    "f2p_late":        {"label":"F2P Late Game (Gen 5-6)","heroes":["Zoe","Marlin","Yang","Petra","Chenko"],"note":"Yang becomes your F2P rally carry. Zoe still holds garrison. Save everything for Yang shards from Gen 5 onward."},
    "rally_offense":   {"label":"Rally Offense (Spender)","heroes":["Amadeus","Vivian","Petra","Thrud","Rosa"],"note":"Amadeus + Vivian lead. Petra for cavalry rallies. Thrud multiplies cavalry. Rosa for arena crossover."},
    "garrison_defense":{"label":"Garrison Defense","heroes":["Jabel","Zoe","Eric","Hilde","Saul"],"note":"Jabel + Zoe core tanks. Eric adds infantry depth. Hilde heals and stacks. Saul stacks via joining."},
    "bear_hunt":       {"label":"Bear Hunt","heroes":["Amadeus","Vivian","Chenko","Amane","Yeonwoo"],"note":"Amadeus and Vivian lead damage. Chenko, Amane, Yeonwoo as S-tier joiners."},
}

# ── COMPANION DATA ──
# Heroes commonly used together (from tier lists + research)
COMPANIONS = {}
for h in HEROES:
    name = h["name"]
    comps = []
    # Rally partners
    if "rally-lead" in h.get("tags", []):
        for other in HEROES:
            if other["name"] != name and ("joiner" in other.get("tags", []) or other.get("joiner") in ("S", "A")):
                comps.append(other["name"])
    # Garrison partners
    if "garrison" in h.get("tags", []):
        for other in HEROES:
            if other["name"] != name and other.get("garrison") in ("S", "A") and other["name"] not in comps:
                comps.append(other["name"])
    # Bear hunt partners
    if "bear" in h.get("tags", []):
        for other in HEROES:
            if other["name"] != name and other.get("bear") in ("S", "A") and other["name"] not in comps:
                comps.append(other["name"])
    COMPANIONS[name] = comps[:6]  # Max 6 companions shown

def slug(name):
    return name.lower().replace(" ", "-").replace("'", "")

def tier_color(t):
    return {"S+":"#fbbf24","S":"#4ade80","A":"#60a5fa","B":"#9ca3af","C":"#f87171","D":"#ef4444"}.get(t, "#6b7280")

def tier_html(label, t):
    if not t or t == "-":
        return f'<span class="ht" style="color:#6b7280">{label}: —</span>'
    return f'<span class="ht" style="color:{tier_color(t)}">{label}: {t}</span>'

def esc(s):
    return str(s).replace("&","&amp;").replace("<","&lt;").replace(">","&gt;").replace('"',"&quot;")

# ── SHARED HTML PARTS ──
HEAD = lambda title, desc, canonical: f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <link rel="canonical" href="https://kingshotpro.com/{canonical}">
  <link rel="stylesheet" href="../../css/style.css">
  <link rel="stylesheet" href="../../css/advisor-orb.css">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8335376690790226" crossorigin="anonymous"></script>
  <style>
    .hero-detail {{ max-width: 800px; margin: 0 auto; }}
    .hd-banner {{ background: var(--surface-2); border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px; margin-bottom: 20px; position: relative; }}
    .hd-banner.legendary {{ border-left: 4px solid var(--gold); }}
    .hd-banner.epic {{ border-left: 4px solid #a78bfa; }}
    .hd-name {{ font-size: 28px; font-weight: 800; color: var(--text); margin-bottom: 4px; }}
    .hd-meta {{ font-size: 13px; color: var(--text-muted); margin-bottom: 12px; }}
    .hd-tiers {{ display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }}
    .ht {{ font-size: 13px; font-weight: 700; }}
    .hd-f2p {{ font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 4px; background: rgba(74,222,128,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); text-transform: uppercase; letter-spacing: 0.5px; display: inline-block; margin-left: 8px; }}
    .hd-best {{ font-size: 15px; font-weight: 700; color: var(--gold); margin-bottom: 8px; }}
    .hd-desc {{ font-size: 14px; color: var(--text-muted); line-height: 1.7; }}
    .hd-section {{ background: var(--surface-2); border: 1px solid var(--border); border-radius: 12px; padding: 20px; margin-bottom: 16px; }}
    .hd-section h2 {{ color: var(--gold); font-size: 17px; margin: 0 0 12px; }}
    .hd-section p, .hd-section li {{ font-size: 13px; color: var(--text-muted); line-height: 1.7; }}
    .hd-section strong {{ color: var(--text); }}
    .hero-pills {{ display: flex; flex-wrap: wrap; gap: 6px; margin: 10px 0; }}
    .hero-pill {{ padding: 5px 14px; font-size: 12px; font-weight: 600; background: rgba(240,192,64,0.1); color: var(--gold); border: 1px solid rgba(240,192,64,0.3); border-radius: 6px; text-decoration: none; }}
    .hero-pill:hover {{ background: rgba(240,192,64,0.2); }}
    .hd-nav {{ display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 13px; }}
    .hd-nav a {{ color: var(--gold); text-decoration: none; }}
    .hd-nav a:hover {{ text-decoration: underline; }}
    .hd-crumbs {{ font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }}
    .hd-crumbs a {{ color: var(--text-muted); text-decoration: none; }}
    .hd-crumbs a:hover {{ color: var(--gold); }}
    .hd-actions {{ display: flex; gap: 10px; margin: 20px 0; flex-wrap: wrap; }}
    .hd-btn {{ padding: 10px 20px; font-size: 13px; font-weight: 700; border-radius: 8px; text-decoration: none; display: inline-block; }}
    .hd-btn-gold {{ background: var(--gold); color: var(--bg); }}
    .hd-btn-outline {{ background: transparent; border: 1px solid var(--border); color: var(--text-muted); }}
    .hd-btn:hover {{ opacity: 0.9; }}
    .gen-heroes {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; margin-top: 12px; }}
    .gen-hero-card {{ background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px; text-align: center; text-decoration: none; color: var(--text); font-size: 13px; font-weight: 600; transition: border-color 0.2s; }}
    .gen-hero-card:hover {{ border-color: var(--gold); color: var(--gold); }}
    .gen-hero-card .troop-icon {{ font-size: 18px; display: block; margin-bottom: 4px; }}
    .ad-slot {{ background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; text-align: center; color: var(--text-muted); font-size: 12px; margin: 16px 0; min-height: 90px; display: flex; align-items: center; justify-content: center; }}
    .sources {{ font-size: 11px; color: var(--text-muted); text-align: center; margin-top: 24px; }}
    .sources a {{ color: var(--text-muted); text-decoration: underline; }}
  </style>
</head>
<body>
<nav class="nav"><a class="nav-brand" href="../../index.html">KingshotPro</a></nav>
<div class="page"><div class="container">
<div class="hero-detail">
'''

FOOTER = '''
</div></div></div>
<footer class="footer"><div class="footer-inner">
  <div><div class="footer-brand">KingshotPro</div>
  <p class="footer-note">Unofficial. Not affiliated with Century Games.</p></div>
  <div class="footer-links">
    <a href="../../about.html">About</a>
    <a href="../../privacy.html">Privacy Policy</a>
    <a href="../../terms.html">Terms of Service</a>
  </div>
</div></footer>
<script src="../../js/cookie-consent.js"></script>
<script src="../../js/layout.js"></script>
<script src="../../js/advisor-names.js"></script>
<script src="../../js/advisor.js"></script>
<script src="../../js/advisor-orb.js"></script>
<script src="../../js/advisor-hooks.js"></script>
<script src="../../js/advisor-chat.js"></script>
<script src="../../js/advisor-cta.js"></script>
<script src="../../js/advisor-lore.js"></script>
<script src="../../js/advisor-referral.js"></script>
<script src="../../js/advisor-alliance.js"></script>
<script src="../../js/advisor-accounts.js"></script>
</body>
</html>'''

TROOP_ICON = {"infantry":"&#9876;","cavalry":"&#127943;","archer":"&#127993;"}

def find_hero(name):
    for h in HEROES:
        if h["name"] == name:
            return h
    return None

def gen_heroes(gen):
    return [h for h in HEROES if h["gen"] == gen]

def get_lineups_for(name):
    result = []
    for key, lineup in LINEUPS.items():
        if name in lineup["heroes"]:
            result.append(lineup)
    return result

# ── INDIVIDUAL HERO PAGE ──
def generate_hero_page(hero, prev_hero, next_hero):
    s = slug(hero["name"])
    title = f'{hero["name"]} — Kingshot Hero Guide | {hero["bestUse"]} | KingshotPro'
    desc = f'{hero["name"]} (Gen {hero["gen"]}, {hero["troop"].title()}) — {hero["bestUse"]}. Tier ratings, best lineups, companions, and investment guide.'
    canonical = f'heroes/{s}/'

    troop_icon = TROOP_ICON.get(hero["troop"], "")
    f2p_badge = '<span class="hd-f2p">F2P</span>' if hero["f2p"] else ""
    rarity_class = "legendary" if hero["rarity"] == "legendary" else "epic"

    html = HEAD(title, desc, canonical)

    # Breadcrumbs
    html += f'<div class="hd-crumbs"><a href="../../heroes.html">Heroes</a> &rsaquo; <a href="../heroes.html">Gen {hero["gen"]}</a> &rsaquo; {esc(hero["name"])}</div>\n'

    # Prev/Next nav
    prev_link = f'<a href="{slug(prev_hero["name"])}/">&larr; {esc(prev_hero["name"])}</a>' if prev_hero else '<span></span>'
    next_link = f'<a href="{slug(next_hero["name"])}/">{esc(next_hero["name"])} &rarr;</a>' if next_hero else '<span></span>'
    html += f'<div class="hd-nav">{prev_link}{next_link}</div>\n'

    # Banner
    html += f'<div class="hd-banner {rarity_class}">\n'
    html += f'  <div class="hd-name">{esc(hero["name"])}{f2p_badge}</div>\n'
    html += f'  <div class="hd-meta">{troop_icon} {hero["troop"].title()} &middot; Generation {hero["gen"]} &middot; {hero["rarity"].title()}</div>\n'
    html += f'  <div class="hd-tiers">{tier_html("Rally",hero["rally"])} {tier_html("Garrison",hero["garrison"])} {tier_html("Bear Hunt",hero["bear"])} {tier_html("Joiner",hero["joiner"])}</div>\n'
    html += f'  <div class="hd-best">{esc(hero["bestUse"])}</div>\n'
    html += f'  <div class="hd-desc">{esc(hero["desc"])}</div>\n'
    html += '</div>\n'

    # Action buttons
    html += '<div class="hd-actions">\n'
    html += f'  <a href="compare/?a={s}" class="hd-btn hd-btn-gold">Compare {esc(hero["name"])}</a>\n'
    html += f'  <a href="companion/?hero={s}" class="hd-btn hd-btn-outline">Build a Team</a>\n'
    html += '</div>\n'

    # Ad slot 1
    html += '<div class="ad-slot" data-slot="hero-detail-top">Ad</div>\n'

    # Companions section
    companions = COMPANIONS.get(hero["name"], [])
    if companions:
        html += '<div class="hd-section">\n'
        html += f'  <h2>Best Companions for {esc(hero["name"])}</h2>\n'
        html += f'  <p>Heroes that pair well with {esc(hero["name"])} based on role synergy and community tier lists.</p>\n'
        html += '  <div class="hero-pills">\n'
        for c in companions:
            html += f'    <a href="{slug(c)}/" class="hero-pill">{esc(c)}</a>\n'
        html += '  </div>\n'
        html += f'  <p style="margin-top:12px;"><a href="companion/?hero={s}" style="color:var(--gold);font-size:13px;">Build a full team with {esc(hero["name"])} &rarr;</a></p>\n'
        html += '</div>\n'

    # Lineups this hero appears in
    lineups = get_lineups_for(hero["name"])
    if lineups:
        html += '<div class="hd-section">\n'
        html += f'  <h2>Recommended Lineups with {esc(hero["name"])}</h2>\n'
        for lineup in lineups:
            html += f'  <div style="margin-bottom:14px;">\n'
            html += f'    <strong>{esc(lineup["label"])}</strong>\n'
            html += '    <div class="hero-pills">\n'
            for h_name in lineup["heroes"]:
                style = ' style="background:rgba(240,192,64,0.25);border-color:var(--gold);"' if h_name == hero["name"] else ""
                html += f'      <a href="{slug(h_name)}/" class="hero-pill"{style}>{esc(h_name)}</a>\n'
            html += '    </div>\n'
            html += f'    <p>{esc(lineup["note"])}</p>\n'
            html += '  </div>\n'
        html += '</div>\n'

    # Investment guide
    html += '<div class="hd-section">\n'
    html += f'  <h2>Investment Guide</h2>\n'
    if hero["f2p"]:
        html += f'  <p><strong>{esc(hero["name"])} is F2P accessible.</strong> Shards are obtainable through events, daily play, and alliance activities without spending money.</p>\n'
        if hero["rarity"] == "epic":
            html += '  <p>As an Epic hero, shard requirements are lower than Legendary heroes. Good for early investment.</p>\n'
        else:
            html += '  <p>As a Legendary F2P hero, prioritize shard collection during featured events. Patience is key — this is a marathon, not a sprint.</p>\n'
    else:
        html += f'  <p><strong>{esc(hero["name"])} requires premium investment</strong> to reach full potential. Typically needs purchased packs or significant event participation for enough shards.</p>\n'
        html += '  <p>For F2P players: this hero is not recommended as a primary investment unless you receive shards through special circumstances.</p>\n'
    html += '</div>\n'

    # Ad slot 2
    html += '<div class="ad-slot" data-slot="hero-detail-mid">Ad</div>\n'

    # Other heroes in same generation
    same_gen = [h for h in gen_heroes(hero["gen"]) if h["name"] != hero["name"]]
    if same_gen:
        html += '<div class="hd-section">\n'
        html += f'  <h2>Other Generation {hero["gen"]} Heroes</h2>\n'
        html += '  <div class="gen-heroes">\n'
        for h in same_gen:
            icon = TROOP_ICON.get(h["troop"], "")
            html += f'    <a href="{slug(h["name"])}/" class="gen-hero-card"><span class="troop-icon">{icon}</span>{esc(h["name"])}</a>\n'
        html += '  </div>\n'
        html += '</div>\n'

    # Similar heroes (same primary role)
    primary_role = None
    if hero.get("rally") in ("S", "S+", "A"): primary_role = "rally"
    elif hero.get("garrison") in ("S", "A"): primary_role = "garrison"
    elif hero.get("joiner") in ("S", "A"): primary_role = "joiner"

    if primary_role:
        similar = []
        for h in HEROES:
            if h["name"] == hero["name"]: continue
            if primary_role == "rally" and h.get("rally") in ("S", "S+", "A"): similar.append(h)
            elif primary_role == "garrison" and h.get("garrison") in ("S", "A"): similar.append(h)
            elif primary_role == "joiner" and h.get("joiner") in ("S", "A"): similar.append(h)
        if similar:
            role_label = {"rally":"Rally","garrison":"Garrison","joiner":"Joiner"}[primary_role]
            html += '<div class="hd-section">\n'
            html += f'  <h2>Other {role_label} Heroes</h2>\n'
            html += '  <div class="gen-heroes">\n'
            for h in similar[:8]:
                icon = TROOP_ICON.get(h["troop"], "")
                html += f'    <a href="{slug(h["name"])}/" class="gen-hero-card"><span class="troop-icon">{icon}</span>{esc(h["name"])}</a>\n'
            html += '  </div>\n'
            html += '</div>\n'

    # Ad slot 3
    html += '<div class="ad-slot" data-slot="hero-detail-bottom">Ad</div>\n'

    # Sources
    html += '<div class="sources">Data cross-verified from <a href="https://kingshotmastery.com/guides/kingshot-hero-tier-list-2025" target="_blank" rel="noopener">Kingshot Mastery</a>, <a href="https://kingshotguides.com/guide/the-only-kingshot-hero-tier-list-you-actually-need/" target="_blank" rel="noopener">Kingshot Guides</a>, <a href="https://kingshotdata.com/category/heroes/" target="_blank" rel="noopener">Kingshot Database</a>. Last updated April 2026.</div>\n'

    html += FOOTER
    return html

# ── COMPARISON PAGE ──
def generate_comparison_page():
    title = "Hero Comparison — KingshotPro"
    desc = "Compare any two Kingshot heroes side by side. Tier ratings, roles, and investment analysis."
    html = HEAD(title, desc, "heroes/compare/")
    html += '<div class="hd-crumbs"><a href="../../heroes.html">Heroes</a> &rsaquo; Compare</div>\n'
    html += '<h1 style="color:var(--gold);text-align:center;margin-bottom:8px;">Compare Heroes</h1>\n'
    html += '<p class="text-muted" style="text-align:center;margin-bottom:24px;">Select two heroes to see a side-by-side comparison.</p>\n'
    html += '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:24px;">\n'
    html += '  <select id="hero-a" style="padding:10px 16px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;min-width:160px;">\n'
    html += '    <option value="">— Hero A —</option>\n'
    for h in HEROES:
        html += f'    <option value="{slug(h["name"])}">{esc(h["name"])} (Gen {h["gen"]})</option>\n'
    html += '  </select>\n'
    html += '  <span style="color:var(--gold);font-weight:700;font-size:18px;align-self:center;">vs</span>\n'
    html += '  <select id="hero-b" style="padding:10px 16px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;min-width:160px;">\n'
    html += '    <option value="">— Hero B —</option>\n'
    for h in HEROES:
        html += f'    <option value="{slug(h["name"])}">{esc(h["name"])} (Gen {h["gen"]})</option>\n'
    html += '  </select>\n'
    html += '</div>\n'
    html += '<div id="compare-result"></div>\n'
    html += '<div class="ad-slot" data-slot="compare-bottom">Ad</div>\n'

    # Embed hero data as JSON for client-side comparison
    json_data = json.dumps({slug(h["name"]): h for h in HEROES})
    html += f'<script>\nvar HERO_DATA = {json_data};\n'
    html += r'''
function renderCompare() {
  var a = document.getElementById("hero-a").value;
  var b = document.getElementById("hero-b").value;
  var el = document.getElementById("compare-result");
  if (!a || !b) { el.innerHTML = ""; return; }
  if (a === b) { el.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Select two different heroes.</p>'; return; }
  var ha = HERO_DATA[a], hb = HERO_DATA[b];
  if (!ha || !hb) { el.innerHTML = ""; return; }

  function tc(t) { return {"S+":"#fbbf24","S":"#4ade80","A":"#60a5fa","B":"#9ca3af","C":"#f87171","D":"#ef4444"}[t] || "#6b7280"; }
  function tv(t) { return {"S+":6,"S":5,"A":4,"B":3,"C":2,"D":1,"-":0}[t] || 0; }
  function cell(label, va, vb) {
    var ca = tc(va), cb = tc(vb);
    var wina = tv(va) > tv(vb) ? " font-weight:900;" : "";
    var winb = tv(vb) > tv(va) ? " font-weight:900;" : "";
    return '<tr><td style="color:var(--text-muted);">' + label + '</td>' +
      '<td style="color:' + ca + ';text-align:center;' + wina + '">' + (va||"—") + '</td>' +
      '<td style="color:' + cb + ';text-align:center;' + winb + '">' + (vb||"—") + '</td></tr>';
  }

  var html = '<table style="width:100%;border-collapse:collapse;margin:20px 0;">';
  html += '<thead><tr><th style="text-align:left;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--text-muted);font-size:12px;"></th>';
  html += '<th style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--gold);font-size:15px;"><a href="' + a + '/" style="color:var(--gold);">' + ha.name + '</a></th>';
  html += '<th style="text-align:center;padding:8px 12px;border-bottom:1px solid var(--border);color:var(--gold);font-size:15px;"><a href="' + b + '/" style="color:var(--gold);">' + hb.name + '</a></th>';
  html += '</tr></thead><tbody>';
  html += '<tr><td style="color:var(--text-muted);padding:6px 12px;">Generation</td><td style="text-align:center;">' + ha.gen + '</td><td style="text-align:center;">' + hb.gen + '</td></tr>';
  html += '<tr><td style="color:var(--text-muted);padding:6px 12px;">Troop</td><td style="text-align:center;">' + ha.troop + '</td><td style="text-align:center;">' + hb.troop + '</td></tr>';
  html += '<tr><td style="color:var(--text-muted);padding:6px 12px;">Rarity</td><td style="text-align:center;">' + ha.rarity + '</td><td style="text-align:center;">' + hb.rarity + '</td></tr>';
  html += '<tr><td style="color:var(--text-muted);padding:6px 12px;">F2P</td><td style="text-align:center;">' + (ha.f2p ? "Yes" : "No") + '</td><td style="text-align:center;">' + (hb.f2p ? "Yes" : "No") + '</td></tr>';
  html += cell("Rally", ha.rally, hb.rally);
  html += cell("Garrison", ha.garrison, hb.garrison);
  html += cell("Bear Hunt", ha.bear, hb.bear);
  html += cell("Joiner", ha.joiner, hb.joiner);
  html += '</tbody></table>';

  html += '<div style="display:flex;gap:16px;margin-top:16px;flex-wrap:wrap;">';
  html += '<div style="flex:1;min-width:250px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;">';
  html += '<div style="color:var(--gold);font-weight:700;margin-bottom:8px;">' + ha.name + '</div>';
  html += '<div style="font-size:13px;color:var(--text-muted);line-height:1.7;">' + ha.bestUse + '. ' + ha.desc + '</div></div>';
  html += '<div style="flex:1;min-width:250px;background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;">';
  html += '<div style="color:var(--gold);font-weight:700;margin-bottom:8px;">' + hb.name + '</div>';
  html += '<div style="font-size:13px;color:var(--text-muted);line-height:1.7;">' + hb.bestUse + '. ' + hb.desc + '</div></div>';
  html += '</div>';

  el.innerHTML = html;
}

document.getElementById("hero-a").addEventListener("change", renderCompare);
document.getElementById("hero-b").addEventListener("change", renderCompare);

// Pre-fill from URL params
(function() {
  var p = new URLSearchParams(window.location.search);
  if (p.get("a")) document.getElementById("hero-a").value = p.get("a");
  if (p.get("b")) document.getElementById("hero-b").value = p.get("b");
  renderCompare();
})();
'''
    html += '</script>\n'
    html += FOOTER
    return html

# ── COMPANION / TEAM BUILDER PAGE ──
def generate_companion_page():
    title = "Team Builder — Build Your Kingshot Lineup | KingshotPro"
    desc = "Build and analyze 3-hero team compositions for Kingshot. See synergy analysis, role coverage, and recommended formations."
    html = HEAD(title, desc, "heroes/companion/")
    html += '<div class="hd-crumbs"><a href="../../heroes.html">Heroes</a> &rsaquo; Team Builder</div>\n'
    html += '<h1 style="color:var(--gold);text-align:center;margin-bottom:8px;">Team Builder</h1>\n'
    html += '<p class="text-muted" style="text-align:center;margin-bottom:24px;">Select 3 heroes to see how they work together. Synergy analysis, role coverage, and formation tips.</p>\n'

    # 3 hero selectors
    for i in range(1, 4):
        html += f'<div style="display:flex;gap:12px;align-items:center;justify-content:center;margin-bottom:12px;">\n'
        html += f'  <span style="color:var(--gold);font-weight:700;width:60px;">Hero {i}</span>\n'
        html += f'  <select id="team-{i}" style="padding:10px 16px;background:var(--surface-2);border:1px solid var(--border);border-radius:8px;color:var(--text);font-size:14px;min-width:180px;">\n'
        html += '    <option value="">— Select —</option>\n'
        for h in HEROES:
            html += f'    <option value="{slug(h["name"])}">{esc(h["name"])} ({h["troop"].title()}, Gen {h["gen"]})</option>\n'
        html += '  </select>\n'
        html += '</div>\n'

    html += '<div style="text-align:center;margin:16px 0;"><button id="analyze-btn" style="padding:12px 28px;background:var(--gold);color:var(--bg);border:none;border-radius:8px;font-weight:700;font-size:14px;cursor:pointer;">Analyze Team</button></div>\n'
    html += '<div id="team-result"></div>\n'
    html += '<div class="ad-slot" data-slot="companion-bottom">Ad</div>\n'

    json_data = json.dumps({slug(h["name"]): h for h in HEROES})
    html += f'<script>\nvar HERO_DATA = {json_data};\n'
    html += r'''
function analyzeTeam() {
  var picks = [
    document.getElementById("team-1").value,
    document.getElementById("team-2").value,
    document.getElementById("team-3").value
  ].filter(Boolean);
  var el = document.getElementById("team-result");

  if (picks.length < 2) { el.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Select at least 2 heroes.</p>'; return; }
  if (new Set(picks).size !== picks.length) { el.innerHTML = '<p style="text-align:center;color:var(--text-muted);">Select different heroes.</p>'; return; }

  var heroes = picks.map(function(s) { return HERO_DATA[s]; }).filter(Boolean);
  if (heroes.length < 2) return;

  function tc(t) { return {"S+":"#fbbf24","S":"#4ade80","A":"#60a5fa","B":"#9ca3af","C":"#f87171","D":"#ef4444"}[t] || "#6b7280"; }
  function tv(t) { return {"S+":6,"S":5,"A":4,"B":3,"C":2,"D":1,"-":0}[t] || 0; }

  // Role coverage
  var bestRally = Math.max.apply(null, heroes.map(function(h){return tv(h.rally)}));
  var bestGarrison = Math.max.apply(null, heroes.map(function(h){return tv(h.garrison)}));
  var bestBear = Math.max.apply(null, heroes.map(function(h){return tv(h.bear)}));
  var bestJoiner = Math.max.apply(null, heroes.map(function(h){return tv(h.joiner)}));

  // Troop diversity
  var troops = {};
  heroes.forEach(function(h) { troops[h.troop] = (troops[h.troop] || 0) + 1; });
  var troopTypes = Object.keys(troops).length;

  // F2P count
  var f2pCount = heroes.filter(function(h){return h.f2p;}).length;

  var html = '<div style="margin-top:24px;">';

  // Team cards
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px;justify-content:center;">';
  heroes.forEach(function(h) {
    var icon = {"infantry":"&#9876;","cavalry":"&#127943;","archer":"&#127993;"}[h.troop] || "";
    html += '<a href="' + h.name.toLowerCase().replace(/ /g,"-").replace(/'/g,"") + '/" style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:16px;text-align:center;min-width:120px;text-decoration:none;">';
    html += '<div style="font-size:24px;">' + icon + '</div>';
    html += '<div style="color:var(--gold);font-weight:700;font-size:15px;">' + h.name + '</div>';
    html += '<div style="color:var(--text-muted);font-size:11px;">' + h.troop + ' · Gen ' + h.gen + '</div>';
    html += '</a>';
  });
  html += '</div>';

  // Synergy analysis
  html += '<div style="background:var(--surface-2);border:1px solid var(--border);border-radius:12px;padding:20px;margin-bottom:16px;">';
  html += '<h2 style="color:var(--gold);font-size:17px;margin:0 0 12px;">Team Analysis</h2>';

  // Strengths
  var strengths = [];
  if (bestRally >= 5) strengths.push("Strong rally potential (S or S+ rally hero present)");
  if (bestGarrison >= 5) strengths.push("Solid garrison defense (S-tier garrison hero present)");
  if (bestBear >= 5) strengths.push("Effective for bear hunt");
  if (bestJoiner >= 5) strengths.push("Has S-tier joiner for stacking");
  if (troopTypes >= 3) strengths.push("Full troop diversity (infantry + cavalry + archer)");
  if (f2pCount === heroes.length) strengths.push("Fully F2P accessible team");

  // Weaknesses
  var weaknesses = [];
  if (bestRally <= 3) weaknesses.push("Weak rally capability — no strong rally lead");
  if (bestGarrison <= 3) weaknesses.push("Weak garrison defense");
  if (troopTypes === 1) weaknesses.push("All same troop type — vulnerable to counters");
  if (f2pCount === 0) weaknesses.push("No F2P heroes — requires significant investment");

  if (strengths.length) {
    html += '<div style="margin-bottom:12px;"><strong style="color:#4ade80;">Strengths</strong><ul style="margin:6px 0;padding-left:18px;">';
    strengths.forEach(function(s) { html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">' + s + '</li>'; });
    html += '</ul></div>';
  }
  if (weaknesses.length) {
    html += '<div><strong style="color:#f87171;">Weaknesses</strong><ul style="margin:6px 0;padding-left:18px;">';
    weaknesses.forEach(function(s) { html += '<li style="font-size:13px;color:var(--text-muted);margin-bottom:4px;">' + s + '</li>'; });
    html += '</ul></div>';
  }

  // Role coverage grid
  html += '<div style="margin-top:16px;"><strong style="color:var(--text);font-size:13px;">Role Coverage</strong>';
  html += '<table style="width:100%;border-collapse:collapse;margin-top:8px;">';
  html += '<tr><td style="padding:4px 8px;color:var(--text-muted);font-size:12px;">Rally</td>';
  heroes.forEach(function(h) { html += '<td style="text-align:center;color:' + tc(h.rally) + ';font-weight:700;font-size:13px;">' + (h.rally||"—") + '</td>'; });
  html += '</tr><tr><td style="padding:4px 8px;color:var(--text-muted);font-size:12px;">Garrison</td>';
  heroes.forEach(function(h) { html += '<td style="text-align:center;color:' + tc(h.garrison) + ';font-weight:700;font-size:13px;">' + (h.garrison||"—") + '</td>'; });
  html += '</tr><tr><td style="padding:4px 8px;color:var(--text-muted);font-size:12px;">Bear Hunt</td>';
  heroes.forEach(function(h) { html += '<td style="text-align:center;color:' + tc(h.bear) + ';font-weight:700;font-size:13px;">' + (h.bear||"—") + '</td>'; });
  html += '</tr><tr><td style="padding:4px 8px;color:var(--text-muted);font-size:12px;">Joiner</td>';
  heroes.forEach(function(h) { html += '<td style="text-align:center;color:' + tc(h.joiner) + ';font-weight:700;font-size:13px;">' + (h.joiner||"—") + '</td>'; });
  html += '</tr></table></div>';

  html += '</div>';
  html += '</div>';

  el.innerHTML = html;
}

document.getElementById("analyze-btn").addEventListener("click", analyzeTeam);

// Pre-fill from URL
(function() {
  var p = new URLSearchParams(window.location.search);
  if (p.get("hero")) {
    document.getElementById("team-1").value = p.get("hero");
  }
})();
'''
    html += '</script>\n'
    html += FOOTER
    return html

# ── MAIN ──
def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))

    # Sort heroes: legendary by gen, then epic by gen
    legendary = sorted([h for h in HEROES if h["rarity"] == "legendary"], key=lambda h: (h["gen"], h["name"]))
    epic = sorted([h for h in HEROES if h["rarity"] == "epic"], key=lambda h: h["name"])
    all_heroes = legendary + epic

    # Generate individual hero pages
    for i, hero in enumerate(all_heroes):
        prev_h = all_heroes[i - 1] if i > 0 else None
        next_h = all_heroes[i + 1] if i < len(all_heroes) - 1 else None
        s = slug(hero["name"])
        hero_dir = os.path.join(out_dir, s)
        os.makedirs(hero_dir, exist_ok=True)
        html = generate_hero_page(hero, prev_h, next_h)
        with open(os.path.join(hero_dir, "index.html"), "w") as f:
            f.write(html)
        print(f"  Generated: /heroes/{s}/")

    # Generate comparison page
    compare_dir = os.path.join(out_dir, "compare")
    os.makedirs(compare_dir, exist_ok=True)
    with open(os.path.join(compare_dir, "index.html"), "w") as f:
        f.write(generate_comparison_page())
    print("  Generated: /heroes/compare/")

    # Generate companion/team builder page
    companion_dir = os.path.join(out_dir, "companion")
    os.makedirs(companion_dir, exist_ok=True)
    with open(os.path.join(companion_dir, "index.html"), "w") as f:
        f.write(generate_companion_page())
    print("  Generated: /heroes/companion/")

    print(f"\nDone! {len(all_heroes)} hero pages + compare + companion = {len(all_heroes) + 2} pages total.")

if __name__ == "__main__":
    main()
