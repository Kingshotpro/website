/**
 * advisory.js — Rule-based advice tree (Phase 1)
 * KingshotPro | Free tier
 *
 * 3 spending tiers × 3 game stages = 9 base combinations.
 * Each returns 3 prioritized recommendations.
 */

// ─────────────────────────────────────────
// ADVICE TREE
// ─────────────────────────────────────────
// Key format: `${spendingTier}_${gameStage}`
// spendingTier: f2p | low | mid | whale
// gameStage:    early | mid | late
// mid and f2p share early/late logic; mid-spender is treated as "low" for Phase 1

const ADVICE_TREE = {

  // ── F2P ──────────────────────────────

  f2p_early: {
    headline: 'Build smart. Every resource counts.',
    tips: [
      {
        title: 'Rush Research before Combat',
        body: 'In early game as F2P, economic research (gathering, construction) compounds faster than combat. Unlock troop T3 before spending speedups on fighting.'
      },
      {
        title: 'Don\'t spend gems on speedups',
        body: 'Save gems for VIP levels and builder queue. Speedups are earned through events — spend gems only when it unlocks a critical gate (VIP 6, then VIP 8).'
      },
      {
        title: 'Prioritize Bear Trap events',
        body: 'Bear Hunt events give resources without cost. Participate every rally for wood, food, and iron. These resources are scarce in early game for F2P.'
      },
    ]
  },

  f2p_mid: {
    headline: 'Stay patient. The gap widens at mid-game.',
    tips: [
      {
        title: 'Hero gear is your multiplier',
        body: 'At mid-game, hero gear (especially combat pieces) dramatically outperforms raw troop power increases. Craft a full set before leveling troops to T4.'
      },
      {
        title: 'Pick one role: farm or fight',
        body: 'F2P can\'t sustain both PvP and PvE. If your server has active conflicts, focus on gathering. If it\'s peaceful, push combat power for events.'
      },
      {
        title: 'Alliance matters more now',
        body: 'Mid-game without a strong alliance is unsustainable for F2P. Alliance help, tech, and gifts can replace hundreds of dollars of spending. Switch if needed.'
      },
    ]
  },

  f2p_late: {
    headline: 'Late-game F2P: influence > individual power.',
    tips: [
      {
        title: 'Server intelligence is your advantage',
        body: 'You can\'t out-power whales, but you can out-think them. Know your server\'s rankings, who\'s in conflict, and position your alliance accordingly.'
      },
      {
        title: 'Transfer if your server is a dead end',
        body: 'F2P on an old server dominated by entrenched whales has limited upside. Research migration options. A younger or more balanced server extends your influence.'
      },
      {
        title: 'Events are your income — don\'t miss one',
        body: 'Late-game F2P lives on event rewards. KvK, Kingdom Events, monthly events — every missed event is resources a spender just bought. No gaps.'
      },
    ]
  },

  // ── LOW SPENDER ($1–$99 lifetime) ────

  low_early: {
    headline: 'Small spend, smart allocation — you have an edge.',
    tips: [
      {
        title: 'Spend on VIP first',
        body: 'The highest ROI early purchase is VIP levels. VIP 6–8 unlocks builder queue slots, resource boosts, and daily rewards that compound for the lifetime of your account.'
      },
      {
        title: 'Event packs over random packs',
        body: 'Don\'t buy random bundles. Wait for event-linked packs (HoG event packs, KvK packs) — they give training speedups + event points, doubling the effective value.'
      },
      {
        title: 'Avoid combat spending until Town Center 15',
        body: 'Early combat gear and troop packs are inefficient. Your $20 goes 3× further after Town Center 15 when T4 troops and tier-2 research is available.'
      },
    ]
  },

  low_mid: {
    headline: 'The bottleneck is Town Center. Everything flows from it.',
    tips: [
      {
        title: 'Town Center upgrade is your highest ROI spend',
        body: 'Each Town Center level unlocks research and troop tiers that multiplicatively improve everything else. If you\'re spending, spend here — speedup packs for the next Town Center level.'
      },
      {
        title: 'Buy hero gear packs, not raw resource packs',
        body: 'Hero gear materials have high-value density. Resource packs are commodities you can farm. A hero gear pack at your spend level is irreplaceable compared to buying wood.'
      },
      {
        title: 'Check the KingshotPro alliance intelligence',
        body: 'Your server\'s competitive landscape affects what to build. If server is dominated by T5 whales, your spend goes further in a transfer than in combat prep.'
      },
    ]
  },

  low_late: {
    headline: 'Late-game with some spend: specialize.',
    tips: [
      {
        title: 'Specialize in one combat role',
        body: 'Low spenders at late game can\'t compete broadly. Pick one: rally leader, garrison defender, or gathering specialist. Build that role to elite level.'
      },
      {
        title: 'Pack value calculator before every purchase',
        body: 'At this stage, every dollar matters. Compare pack value in gem-equivalent terms. The "limited 7-day" packs are usually better value than recurring weekly packs.'
      },
      {
        title: 'Alliance rank matters for your spending efficiency',
        body: 'Being in a top-3 alliance multiplies the value of your spend through alliance events, tech, and protection. Spend to help alliance events, not solo building.'
      },
    ]
  },

  // ── MID SPENDER ($100–$499) ──────────
  // Reuse low_ tree — same priorities, just more purchasing power

  mid_early: {
    headline: 'You have runway. Use it at the right gates.',
    tips: [
      {
        title: 'Max VIP to 10 before anything else',
        body: 'Mid-spenders who max VIP early enjoy compounding daily rewards for the entire game. Don\'t spread early spend on combat — lock in VIP ROI first.'
      },
      {
        title: 'Speedup packs at Town Center gates (10, 15, 21)',
        body: 'Town Center gates are where mid-spenders pull ahead. Buy speedup-heavy packs to hit TC15, TC21, and TC25+ faster than low spenders. The gap compounds.'
      },
      {
        title: 'Don\'t upgrade heroes evenly',
        body: 'Focus 1–2 heroes to max rather than spreading shards across 6. One maxed combat hero at mid-stage beats three half-built ones. Pick your main, commit.'
      },
    ]
  },

  mid_mid: {
    headline: 'You\'re in the game. Now outposition, not outspend.',
    tips: [
      {
        title: 'T4 research is non-negotiable',
        body: 'If T4 troops aren\'t unlocked, that\'s the single spend target. Everything else is supplementary until you have T4. Focus spending here until it\'s done.'
      },
      {
        title: 'War Academy tech before hero gear upgrades',
        body: 'War Academy march-speed, training speed, and troop bonuses outperform hero gear in mid-game. Prioritize tech research packs over gear mat packs.'
      },
      {
        title: 'Alliance position dictates spending direction',
        body: 'If your alliance is competing for kingdom positions, buy combat packs. If your server is peaceful, resource and research packs deliver better long-term ROI.'
      },
    ]
  },

  mid_late: {
    headline: 'Late-game mid spender: you can compete selectively.',
    tips: [
      {
        title: 'Server transfer may reset your ROI clock',
        body: 'A mid-spender on a stale server may get more value by transferring to a newer or more competitive server where $100 of spend has server-level impact.'
      },
      {
        title: 'Buy T5 research speedups — not T5 troops directly',
        body: 'T5 research gives permanent bonuses even after the content ages. T5 troop packs are expensive and the troops can be killed. Unlock the research, then train troops slowly.'
      },
      {
        title: 'Watch your server intel before kingdom events',
        body: 'Before KvK or Kingdom Takeover, check server rankings and whale counts. Target the events where your power tier is competitive — don\'t waste spend fighting far above your class.'
      },
    ]
  },

  // ── WHALE ($500+ lifetime) ───────────

  whale_early: {
    headline: 'You\'ll dominate early. Position for late-game.',
    tips: [
      {
        title: 'Skip early combat — it\'s a waste at Town Center < 15',
        body: 'Even whale spending on combat before TC15 has poor ROI. Spend on VIP max, Town Center speedups, and research. You\'ll lap everyone else when you unlock T4 in week 2.'
      },
      {
        title: 'Form or join the strongest alliance immediately',
        body: 'Your spend should be collective — whale spending in a top alliance wins server events and compounds for everyone. Don\'t whale solo in a mid-tier alliance.'
      },
      {
        title: 'Server selection matters',
        body: 'If you\'re opening on a new server, assess the early competition. A server without other whales is an easy kingdom throne. A server with 10 whales fragments the power.'
      },
    ]
  },

  whale_mid: {
    headline: 'Server dominance is achievable. Lock it in now.',
    tips: [
      {
        title: 'T5 research is your moat',
        body: 'Getting T5 research before your server competitors is the single highest-impact whale spend. The research bonuses affect every combat engagement for the rest of the game.'
      },
      {
        title: 'Gear max, then gems on hero shards',
        body: 'Mid-game whales should max governor gear, then spend on hero shard packs. A maxed hero at this stage creates a power gap that takes months for non-whales to close.'
      },
      {
        title: 'Server intelligence: who else is whaling?',
        body: 'Check our alliance power rankings for your kingdom. If two whales are racing, your spending efficiency drops. If you\'re the top wallet, hold throne events easily.'
      },
    ]
  },

  whale_late: {
    headline: 'Late-game whale: server leadership is your game now.',
    tips: [
      {
        title: 'Alliance management ROI > personal power ROI',
        body: 'At max or near-max power, additional personal spend has diminishing returns. Investing in alliance growth, recruiting strong mid-spenders, and server diplomacy compounds your lead.'
      },
      {
        title: 'Transfer to remain competitive',
        body: 'If your server has been conquered, a transfer to a competitive server activates new objectives. Stagnant servers reduce whale spend incentive.'
      },
      {
        title: 'Check our server intelligence for transfer targets',
        body: 'Our kingdom ranking data shows power distributions across servers. A whale on a balanced server stays relevant longer than one who flattened everyone in 90 days.'
      },
    ]
  },
};

// ─────────────────────────────────────────
// RENDERER
// ─────────────────────────────────────────

function getAdvice(profile) {
  const tier  = profile.spendingTier; // f2p | low | mid | whale
  const stage = profile.gameStage;    // early | mid | late

  // Map mid-spender to "mid" key (has its own entries)
  const key = `${tier}_${stage}`;

  return ADVICE_TREE[key] || ADVICE_TREE['f2p_mid']; // safe fallback
}

function renderAdvisory(profile) {
  const section = document.getElementById('advisory');
  const header  = document.getElementById('advisory-header');
  const grid    = document.getElementById('advice-grid');
  if (!section || !grid) return;

  const advice = getAdvice(profile);

  // Get advisor identity if available
  let advisorIntro = '';
  let advisorName = '';
  if (window.Advisor) {
    const state = window.Advisor.getState();
    if (state && state.name) {
      advisorName = state.name;
      const arch = window.Advisor.ARCHETYPES[state.archetype];
      const title = arch ? arch.title : '';
      advisorIntro = `<span class="advice-advisor">${advisorName}, ${title}:</span> `;
    }
  }

  if (header) {
    header.innerHTML = `
      <h2>${advisorName ? advisorName + '\'s Counsel' : 'Your Top Priorities'}</h2>
      <p>${advisorIntro}${advice.headline}</p>
    `;
  }

  let cardsHTML = advice.tips.map((tip, i) => `
    <div class="advice-card">
      <div class="advice-rank">Priority ${i + 1}</div>
      <div class="advice-title">${tip.title}</div>
      <div class="advice-body">${tip.body}</div>
    </div>
  `).join('');

  // Add observation insight if enough data
  if (window.Advisor) {
    const tags = window.Advisor.getTags();
    if (tags.length > 0) {
      const state = window.Advisor.getState();
      const visits = state ? (state.observations.visit_pattern || {}).total || 0 : 0;
      if (visits >= 3) {
        cardsHTML += `
          <div class="advice-card advice-insight">
            <div class="advice-rank">${advisorName || 'Advisor'} Observes</div>
            <div class="advice-body">Based on your activity patterns, I have additional counsel. Open the advisor panel for details.</div>
          </div>
        `;
      }
    }
  }

  grid.innerHTML = cardsHTML;

  section.classList.add('visible');
  section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─────────────────────────────────────────
// INIT
// ─────────────────────────────────────────

window.KSP = window.KSP || {};
window.KSP.renderAdvisory = renderAdvisory;
window.KSP.getAdvice      = getAdvice;
