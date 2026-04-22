/**
 * auth-signup.js — Magic-link email signup form.
 *
 * Wires any `#auth-signup-form` element on the page to the Worker's
 * /auth/send endpoint. Sends an email via Resend that points the user
 * at /auth/?token=X, where auth/index.html calls /auth/verify and
 * completes the login by setting the `ksp_session` httpOnly cookie.
 *
 * Works on any page that includes an #auth-signup-form. The homepage
 * renders the form inside .auth-signup; add the same form to pricing
 * or profile pages later and this module handles them automatically.
 *
 * Backend contracts:
 *   POST /auth/send    { email }           → { ok: true } | { error }
 *   POST /auth/verify  { token, fid }      → sets Set-Cookie, { ok: true, tier }
 *
 * Rate-limit: the Worker does not currently enforce per-email rate limits.
 * A client-side cooldown here (60s per email, localStorage) prevents a
 * simple mis-click storm while a real server limit is being designed.
 */
(function () {
  'use strict';

  var API = 'https://kingshotpro-api.kingshotpro.workers.dev';

  // Client-side cooldown — stops double-submits, NOT abuse.
  var COOLDOWN_MS = 60_000;
  var COOLDOWN_KEY_PREFIX = 'ksp_auth_send_cd_';

  // Returns 0 if no cooldown active, otherwise seconds remaining.
  function cooldownRemaining(email) {
    try {
      var raw = localStorage.getItem(COOLDOWN_KEY_PREFIX + email.toLowerCase());
      if (!raw) return 0;
      var until = parseInt(raw, 10);
      var left  = Math.ceil((until - Date.now()) / 1000);
      return left > 0 ? left : 0;
    } catch (e) { return 0; }
  }
  function markCooldown(email) {
    try {
      localStorage.setItem(
        COOLDOWN_KEY_PREFIX + email.toLowerCase(),
        String(Date.now() + COOLDOWN_MS)
      );
    } catch (e) {}
  }

  function setStatus(form, type, message) {
    var statusEl = form.parentElement.querySelector('.auth-signup-status');
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.className = 'auth-signup-status ' + (type || '');
    if (!message) statusEl.className = 'auth-signup-status';
  }

  function handleSubmit(e) {
    e.preventDefault();
    var form   = e.target;
    var input  = form.querySelector('input[type="email"]');
    var button = form.querySelector('button[type="submit"]');
    if (!input || !button) return;

    var email = (input.value || '').trim();
    if (!email || email.indexOf('@') < 1) {
      setStatus(form, 'err', 'Please enter a valid email address.');
      return;
    }

    var left = cooldownRemaining(email);
    if (left > 0) {
      setStatus(form, 'info', 'A link was already sent. Check your inbox, or try again in ' + left + 's.');
      return;
    }

    button.disabled = true;
    var origText = button.textContent;
    button.textContent = 'Sending…';
    setStatus(form, 'info', 'Sending the magic link to ' + email + '…');

    fetch(API + '/auth/send', {
      method:      'POST',
      credentials: 'include',
      headers:     { 'Content-Type': 'application/json' },
      body:        JSON.stringify({ email: email }),
    })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (data) { return { ok: r.ok, data: data }; }); })
      .then(function (res) {
        button.disabled = false;
        button.textContent = origText;
        if (!res.ok || res.data.error) {
          setStatus(form, 'err', 'Send failed: ' + (res.data.error || ('status ' + (res.ok ? 'unknown' : 'error'))) + '. Try again.');
          return;
        }
        markCooldown(email);
        setStatus(form, 'ok',
          '✓ Check your inbox at ' + email + '. ' +
          'The link is good for 10 minutes.'
        );
        input.value = '';
      })
      .catch(function () {
        button.disabled = false;
        button.textContent = origText;
        setStatus(form, 'err', 'Network error. Try again.');
      });
  }

  function wireForms() {
    var forms = document.querySelectorAll('#auth-signup-form');
    for (var i = 0; i < forms.length; i++) {
      if (forms[i].getAttribute('data-wired') === '1') continue;
      forms[i].setAttribute('data-wired', '1');
      forms[i].addEventListener('submit', handleSubmit);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wireForms);
  } else {
    wireForms();
  }
})();
