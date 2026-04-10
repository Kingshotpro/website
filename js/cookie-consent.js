/**
 * cookie-consent.js — GDPR cookie consent banner
 * Shows once. Choice stored in localStorage. Blocks non-essential cookies until accepted.
 */
(function () {
  'use strict';
  var KEY = 'ksp_cookie_consent';

  function getConsent() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(KEY, value); } catch (e) {}
  }

  function showBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<div class="cookie-text">' +
        'We use cookies for authentication and to improve your experience. ' +
        'Third-party services (Google AdSense, Stripe) may set their own cookies. ' +
        '<a href="privacy.html" style="color:var(--gold);">Privacy Policy</a>' +
      '</div>' +
      '<div class="cookie-buttons">' +
        '<button class="btn btn-primary cookie-btn" id="cookie-accept">Accept All</button>' +
        '<button class="btn btn-outline cookie-btn" id="cookie-essential">Essential Only</button>' +
      '</div>';
    document.body.appendChild(banner);

    document.getElementById('cookie-accept').addEventListener('click', function () {
      setConsent('all');
      banner.remove();
    });
    document.getElementById('cookie-essential').addEventListener('click', function () {
      setConsent('essential');
      banner.remove();
      // Disable ad scripts if they exist
      document.querySelectorAll('.ad-slot').forEach(function (el) { el.style.display = 'none'; });
    });
  }

  if (!getConsent()) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  } else if (getConsent() === 'essential') {
    // Hide ad slots for essential-only users
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.ad-slot').forEach(function (el) { el.style.display = 'none'; });
    });
  }
})();
