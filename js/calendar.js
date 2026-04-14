/**
 * calendar.js — Event Calendar with Push Notifications
 * KingshotPro
 *
 * Displays Kingshot event schedule with live countdowns.
 * Browser push notifications fire before events start.
 * User configures server reset time. Custom events supported.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'ksp_calendar_events';
  var OFFSET_KEY = 'ksp_utc_offset';
  var LEAD_KEY = 'ksp_notif_lead';
  var FIRED_KEY = 'ksp_notif_fired';

  // Color coding by frequency
  var COLORS = { daily: '#5c8ce0', 'bi-daily': '#5c8ce0', weekly: '#4caf82', biweekly: '#9b59b6', monthly: '#f0c040', custom: '#e05c5c' };

  var DEFAULT_EVENTS = [
    { name: 'Bear Hunt', freq: 'bi-daily', duration: 30, desc: 'Rally-based, free resources. 30 min.' },
    { name: 'Arena', freq: 'daily', duration: 0, desc: '5 daily attempts. Fight for ranking.' },
    { name: 'Mystic Trial', freq: 'daily', duration: 1440, desc: 'Rotating daily challenge.' },
    { name: "Eternity's Reach", freq: 'daily', duration: 30, desc: 'Multiple 30-min slots per day. Verify schedule in-game.' },
    { name: 'Tri-Alliance Clash', freq: 'weekly', day: 6, duration: 60, desc: 'Saturday 60-min battle.' },
    { name: 'Swordland Showdown', freq: 'biweekly', day: 0, duration: 60, desc: 'Biweekly Sunday battle.' },
    { name: 'Alliance Championship', freq: 'weekly', day: 5, duration: 0, desc: 'Weekly alliance competition.' },
    { name: 'Strongest Governor', freq: 'weekly', day: 1, duration: 4320, desc: 'Multi-day weekly event starting Monday.' },
    { name: 'Hall of Governors', freq: 'biweekly', day: 1, duration: 4320, desc: 'Major growth event. Save speedups for this.' },
    { name: 'KvK (Kingdom vs Kingdom)', freq: 'monthly', day: 22, duration: 10080, desc: 'Monthly kingdom vs kingdom. Week 4.' },
    { name: 'Alliance Mobilization', freq: 'weekly', day: 4, duration: 1440, desc: 'After Strongest Governor. Coordinate with alliance.' },
  ];

  var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function getEvents() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_EVENTS.slice();
    } catch (e) { return DEFAULT_EVENTS.slice(); }
  }

  function saveEvents(events) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (e) {}
  }

  function getOffset() {
    try { return parseInt(localStorage.getItem(OFFSET_KEY) || '0', 10); } catch (e) { return 0; }
  }

  function getLeadMin() {
    try { return parseInt(localStorage.getItem(LEAD_KEY) || '15', 10); } catch (e) { return 15; }
  }

  function getFired() {
    try { return JSON.parse(localStorage.getItem(FIRED_KEY) || '{}'); } catch (e) { return {}; }
  }

  function setFired(key) {
    var fired = getFired();
    fired[key] = Date.now();
    // Clean entries older than 24 hours
    var cutoff = Date.now() - 86400000;
    for (var k in fired) { if (fired[k] < cutoff) delete fired[k]; }
    try { localStorage.setItem(FIRED_KEY, JSON.stringify(fired)); } catch (e) {}
  }

  // Get next occurrence of an event from now
  function getNextOccurrence(event) {
    var now = new Date();
    var next = new Date(now);

    if (event.freq === 'daily' || event.freq === 'bi-daily') {
      // Next occurrence is today at reset time or tomorrow
      next.setHours(0, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + (event.freq === 'bi-daily' ? 2 : 1));
    } else if (event.freq === 'weekly') {
      var targetDay = event.day || 0;
      var daysUntil = (targetDay - now.getDay() + 7) % 7;
      if (daysUntil === 0 && now.getHours() >= 12) daysUntil = 7;
      next.setDate(now.getDate() + daysUntil);
      next.setHours(0, 0, 0, 0);
    } else if (event.freq === 'biweekly') {
      var targetDay = event.day || 0;
      var daysUntil = (targetDay - now.getDay() + 7) % 7;
      if (daysUntil === 0) daysUntil = 14;
      next.setDate(now.getDate() + daysUntil);
      next.setHours(0, 0, 0, 0);
    } else if (event.freq === 'monthly') {
      var targetDate = event.day || 22;
      next = new Date(now.getFullYear(), now.getMonth(), targetDate);
      if (next <= now) next.setMonth(next.getMonth() + 1);
    }

    return next;
  }

  function formatCountdown(ms) {
    if (ms <= 0) return 'NOW';
    var s = Math.floor(ms / 1000);
    var d = Math.floor(s / 86400); s %= 86400;
    var h = Math.floor(s / 3600); s %= 3600;
    var m = Math.floor(s / 60); s %= 60;
    if (d > 0) return d + 'd ' + h + 'h ' + m + 'm';
    if (h > 0) return h + 'h ' + m + 'm ' + s + 's';
    return m + 'm ' + s + 's';
  }

  // ── Calendar export helpers ──────────────
  function toICSDate(d) {
    return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  }

  function getRecurrenceRule(e) {
    if (e.freq === 'daily') return 'RRULE:FREQ=DAILY';
    if (e.freq === 'bi-daily') return 'RRULE:FREQ=DAILY;INTERVAL=2';
    if (e.freq === 'weekly') return 'RRULE:FREQ=WEEKLY';
    if (e.freq === 'biweekly') return 'RRULE:FREQ=WEEKLY;INTERVAL=2';
    if (e.freq === 'monthly') return 'RRULE:FREQ=MONTHLY';
    return '';
  }

  function downloadICS(e, nextDate) {
    var start = new Date(nextDate);
    var end = new Date(start.getTime() + (e.duration || 60) * 60000);
    var rrule = getRecurrenceRule(e);

    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//KingshotPro//EN\r\n' +
      'BEGIN:VEVENT\r\n' +
      'DTSTART:' + toICSDate(start) + '\r\n' +
      'DTEND:' + toICSDate(end) + '\r\n' +
      'SUMMARY:Kingshot: ' + e.name + '\r\n' +
      'DESCRIPTION:' + (e.desc || e.name) + ' — via KingshotPro\\nkingshotpro.com/calendar.html\r\n' +
      (rrule ? rrule + '\r\n' : '') +
      'BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:' + e.name + ' starts in 15 minutes\r\nEND:VALARM\r\n' +
      'END:VEVENT\r\nEND:VCALENDAR';

    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = e.name.replace(/[^a-zA-Z0-9]/g, '_') + '.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  function googleCalURL(e, nextDate) {
    var start = new Date(nextDate);
    var end = new Date(start.getTime() + (e.duration || 60) * 60000);
    var fmt = function (d) { return d.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z/, 'Z'); };
    var recur = '';
    if (e.freq === 'daily') recur = '&recur=RRULE:FREQ=DAILY';
    else if (e.freq === 'weekly') recur = '&recur=RRULE:FREQ=WEEKLY';
    else if (e.freq === 'biweekly') recur = '&recur=RRULE:FREQ=WEEKLY;INTERVAL=2';
    else if (e.freq === 'monthly') recur = '&recur=RRULE:FREQ=MONTHLY';

    return 'https://calendar.google.com/calendar/render?action=TEMPLATE' +
      '&text=' + encodeURIComponent('Kingshot: ' + e.name) +
      '&dates=' + fmt(start) + '/' + fmt(end) +
      '&details=' + encodeURIComponent((e.desc || '') + '\nvia KingshotPro — kingshotpro.com') +
      recur;
  }

  // Render events
  function render() {
    var container = document.getElementById('cal-events');
    if (!container) return;

    var events = getEvents();
    var html = '';

    // Sort by next occurrence
    var withNext = events.map(function (e, i) {
      return { event: e, next: getNextOccurrence(e), index: i };
    }).sort(function (a, b) { return a.next - b.next; });

    for (var i = 0; i < withNext.length; i++) {
      var item = withNext[i];
      var e = item.event;
      var color = COLORS[e.freq] || COLORS.custom;
      var ms = item.next - new Date();
      var countdown = formatCountdown(ms);
      var dayLabel = e.day !== undefined ? DAY_NAMES[e.day] || '' : '';
      var freqLabel = e.freq === 'bi-daily' ? 'Every 2 days' : e.freq.charAt(0).toUpperCase() + e.freq.slice(1);

      html += '<div class="cal-event" style="border-left:4px solid ' + color + ';">' +
        '<div class="cal-event-header">' +
          '<span class="cal-event-name">' + e.name + '</span>' +
          '<span class="cal-event-countdown" data-next="' + item.next.getTime() + '">' + countdown + '</span>' +
        '</div>' +
        '<div class="cal-event-meta">' +
          '<span class="cal-freq" style="color:' + color + ';">' + freqLabel + '</span>' +
          (dayLabel ? ' · ' + dayLabel : '') +
          (e.duration ? ' · ' + (e.duration >= 1440 ? (e.duration / 1440) + ' day(s)' : e.duration + ' min') : '') +
        '</div>' +
        (e.desc ? '<div class="cal-event-desc">' + e.desc + '</div>' : '') +
        '<div class="cal-event-actions">' +
          '<button class="cal-btn-ics" data-idx="' + item.index + '" data-next="' + item.next.getTime() + '">📥 Add to Calendar</button>' +
          '<a class="cal-btn-gcal" href="' + googleCalURL(e, item.next) + '" target="_blank" rel="noopener">📅 Google Calendar</a>' +
        '</div>' +
        '</div>';
    }

    container.innerHTML = html;

    // Wire ICS download buttons
    var icsBtns = container.querySelectorAll('.cal-btn-ics');
    for (var j = 0; j < icsBtns.length; j++) {
      icsBtns[j].addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-idx'), 10);
        var nextTs = parseInt(this.getAttribute('data-next'), 10);
        var events = getEvents();
        if (events[idx]) downloadICS(events[idx], new Date(nextTs));
      });
    }
  }

  // Update countdowns every second
  function tick() {
    var els = document.querySelectorAll('.cal-event-countdown');
    var now = Date.now();
    for (var i = 0; i < els.length; i++) {
      var next = parseInt(els[i].getAttribute('data-next'), 10);
      els[i].textContent = formatCountdown(next - now);
    }
  }

  // Check notifications
  function checkNotifications() {
    if (Notification.permission !== 'granted') return;
    var events = getEvents();
    var lead = getLeadMin() * 60000;
    var now = Date.now();
    var fired = getFired();

    for (var i = 0; i < events.length; i++) {
      var next = getNextOccurrence(events[i]);
      var diff = next.getTime() - now;
      var key = events[i].name + '_' + next.toDateString();

      if (diff > 0 && diff <= lead && !fired[key]) {
        new Notification('KingshotPro — ' + events[i].name, {
          body: events[i].name + ' starts in ' + Math.round(diff / 60000) + ' minutes!',
          icon: '/avatars/female_default.png',
        });
        setFired(key);
      }
    }
  }

  // Custom event form
  function setupCustomForm() {
    var btn = document.getElementById('cal-add-btn');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var name = document.getElementById('cal-custom-name').value.trim();
      var freq = document.getElementById('cal-custom-freq').value;
      var day = parseInt(document.getElementById('cal-custom-day').value, 10);
      var dur = parseInt(document.getElementById('cal-custom-dur').value, 10) || 0;

      if (!name) return;

      var events = getEvents();
      events.push({ name: name, freq: freq, day: isNaN(day) ? undefined : day, duration: dur, desc: 'Custom event', custom: true });
      saveEvents(events);
      render();

      document.getElementById('cal-custom-name').value = '';
    });
  }

  // Notification permission
  function setupNotifToggle() {
    var toggle = document.getElementById('cal-notif-toggle');
    if (!toggle) return;

    toggle.addEventListener('change', function () {
      if (toggle.checked && Notification.permission !== 'granted') {
        Notification.requestPermission().then(function (perm) {
          if (perm !== 'granted') toggle.checked = false;
        });
      }
    });

    // Lead time
    var leadPicker = document.getElementById('cal-lead-time');
    if (leadPicker) {
      leadPicker.value = getLeadMin();
      leadPicker.addEventListener('change', function () {
        try { localStorage.setItem(LEAD_KEY, leadPicker.value); } catch (e) {}
      });
    }
  }

  // Download ALL events as one .ics file
  function downloadAllICS() {
    var events = getEvents();
    var ics = 'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//KingshotPro//EN\r\n';

    for (var i = 0; i < events.length; i++) {
      var e = events[i];
      var next = getNextOccurrence(e);
      var start = new Date(next);
      var end = new Date(start.getTime() + (e.duration || 60) * 60000);
      var rrule = getRecurrenceRule(e);

      ics += 'BEGIN:VEVENT\r\n' +
        'DTSTART:' + toICSDate(start) + '\r\n' +
        'DTEND:' + toICSDate(end) + '\r\n' +
        'SUMMARY:Kingshot: ' + e.name + '\r\n' +
        'DESCRIPTION:' + (e.desc || e.name) + '\\nvia KingshotPro\r\n' +
        (rrule ? rrule + '\r\n' : '') +
        'BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\nDESCRIPTION:' + e.name + ' starts soon\r\nEND:VALARM\r\n' +
        'END:VEVENT\r\n';
    }

    ics += 'END:VCALENDAR';
    var blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'KingshotPro_Events.ics';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Init
  function init() {
    render();
    setupCustomForm();
    setupNotifToggle();
    setInterval(tick, 1000);
    setInterval(checkNotifications, 60000);

    var addAllBtn = document.getElementById('cal-add-all');
    if (addAllBtn) addAllBtn.addEventListener('click', downloadAllICS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
