/* stars.js — live GitHub star count as a "career stat".
   Unauthenticated API, sessionStorage-cached, fails gracefully to "—". */
(function () {
  'use strict';

  var API = 'https://api.github.com/repos/MadB0i/gracias-messi';
  var KEY = 'gm-stars';

  function set(el, n, animate) {
    if (!el) return;
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!animate || reduced) {
      el.textContent = n.toLocaleString();
      return;
    }
    var t0 = performance.now(), dur = 900;
    (function tick(now) {
      var k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(n * (1 - Math.pow(1 - k, 3))).toLocaleString();
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function show(n) {
    var el = document.getElementById('starCount');
    if (!el) return;
    if (typeof n === 'number') {
      set(el, n, true);
      try { sessionStorage.setItem(KEY, String(n)); } catch (e) { /* noop */ }
    } else if (n !== null) {
      el.textContent = n.toLocaleString();
    }
  }

  function init() {
    var cached = null;
    try {
      var c = sessionStorage.getItem(KEY);
      if (c) cached = parseInt(c, 10);
    } catch (e) { /* noop */ }

    if (cached) show(cached);

    fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('rate-limited');
        return r.json();
      })
      .then(function (d) { show(d.stargazers_count); })
      .catch(function () {
        // graceful: keep cached value, or the placeholder dash
        if (cached === null) {
          var el = document.getElementById('starCount');
          if (el) el.textContent = '—';
        }
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
