(function() {
  const visitCountKey = 'ksp_visit_count';
  const lastCtaKey = 'ksp_last_cta';
  const dismissedCountKey = 'ksp_cta_dismissed';
  const cooldownKey = 'ksp_cta_cooldown';
  const tierKey = 'ksp_tier';

  const visitCount = parseInt(localStorage.getItem(visitCountKey) || '0', 10) + 1;
  localStorage.setItem(visitCountKey, visitCount);

  const currentTier = localStorage.getItem(tierKey) || 'free';
  const cooldownDate = new Date(localStorage.getItem(cooldownKey) || 0);
  const now = new Date();

  if (now < cooldownDate) return;

  const dismissedCount = parseInt(localStorage.getItem(dismissedCountKey) || '0', 10);

  function showCta(text) {
    localStorage.setItem(lastCtaKey, text);
    window.AdvisorOrb.showSpeechBubble(text);
    setTimeout(() => window.AdvisorOrb.hideSpeechBubble(), 10000);
  }

  function getNextTierCta() {
    switch (currentTier) {
      case 'pro':
        return "KvK is coming. War Council subscribers already have enemy intelligence.";
      case 'war_council':
        return "I have stored every conversation we have had. Elite unlocks my full memory of you.";
      default:
        return null;
    }
  }

  if (currentTier !== 'elite') {
    const nextTierCta = getNextTierCta();
    if (nextTierCta) {
      showCta(nextTierCta);
      return;
    }
  }

  if (visitCount <= 3) return;

  if (visitCount >= 15) {
    if (dismissedCount >= 3) {
      const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days
      localStorage.setItem(cooldownKey, new Date(now.getTime() + cooldownPeriod).toISOString());
      return;
    }

    const lastCta = localStorage.getItem(lastCtaKey);
    const ctas = [
      "You study armies obsessively. Pro lets me tell you what I really see.",
      "Your heroes are fighting undergeared. Pro unlocks the analysis that fixes that.",
      "Your infrastructure is strong. Pro lets me show you when to shift to combat.",
      "You show up every day. Pro gives you an advisor who never runs out of counsel.",
      "You have been using this site for a while. There is more I can offer."
    ];

    const nextCta = ctas.find(cta => cta !== lastCta);
    if (nextCta) {
      showCta(nextCta);
      return;
    }
  }

  if (visitCount >= 8 && visitCount <= 14) {
    setTimeout(() => {
      const tags = window.Advisor.getTags();
      const tagToCta = {
        combat_prioritizer: "You study armies obsessively. Pro lets me tell you what I really see.",
        neglects_gear: "Your heroes are fighting undergeared. Pro unlocks the analysis that fixes that.",
        builder: "Your infrastructure is strong. Pro lets me show you when to shift to combat.",
        daily_player: "You show up every day. Pro gives you an advisor who never runs out of counsel."
      };

      const cta = tags.map(tag => tagToCta[tag]).find(cta => cta) || "You have been using this site for a while. There is more I can offer.";
      showCta(cta);
    }, 8000);
  }

  window.addEventListener("ksp:energy_depleted", () => {
    if (visitCount >= 4 && visitCount <= 7) {
      showCta("Energy depleted! Consider upgrading to Pro for more insights.");
    }
  });

  window.addEventListener("ksp:scripted_limit", () => {
    if (visitCount >= 4 && visitCount <= 7) {
      showCta("I can't answer that. Pro gives you deeper insights.");
    }
  });
})();