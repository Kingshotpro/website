/**
 * cookie-consent.js — GDPR cookie consent banner + Google Consent Mode v2
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

  // Google Consent Mode v2 — must fire before AdSense loads
  function initConsentMode() {
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    // Default: all ad-related storage denied
    gtag('consent', 'default', {
      ad_storage:           'denied',
      ad_user_data:         'denied',
      ad_personalization:   'denied',
      analytics_storage:    'denied',
      wait_for_update:      500
    });
  }

  function grantConsent() {
    if (!window.gtag) return;
    window.gtag('consent', 'update', {
      ad_storage:           'granted',
      ad_user_data:         'granted',
      ad_personalization:   'granted',
      analytics_storage:    'granted'
    });
  }

  function denyConsent() {
    if (!window.gtag) return;
    window.gtag('consent', 'update', {
      ad_storage:           'denied',
      ad_user_data:         'denied',
      ad_personalization:   'denied',
      analytics_storage:    'denied'
    });
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
      grantConsent();
      banner.remove();
    });
    document.getElementById('cookie-essential').addEventListener('click', function () {
      setConsent('essential');
      denyConsent();
      banner.remove();
      document.querySelectorAll('.ad-slot').forEach(function (el) { el.style.display = 'none'; });
    });
  }

  // Fire consent defaults immediately (before AdSense)
  initConsentMode();

  // Restore prior consent on return visits
  var prior = getConsent();
  if (prior === 'all') {
    grantConsent();
  } else if (prior === 'essential') {
    denyConsent();
    document.addEventListener('DOMContentLoaded', function () {
      document.querySelectorAll('.ad-slot').forEach(function (el) { el.style.display = 'none'; });
    });
  } else {
    // No prior choice — show banner
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner);
    } else {
      showBanner();
    }
  }
})();
