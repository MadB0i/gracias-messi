/* whereyou.js — "Where were you when…". One input (birth year, or the
   year you started watching), then a second line under every timeline
   milestone: the visitor's age at that moment, or "Not born yet".
   Client-side only, sessionStorage, no tracking. Re-renders on
   language change (gm:lang). Reads years from the rendered timeline
   (which is the page's data, itself from messi-career.json). */
(function () {
  'use strict';

  var STORE = 'gm-birth';
  var MIN = 1940, MAX = 2026;

  var form, input, clearBtn;
  var birth = null;

  function i18n(key, vars) {
    if (window.__GM_I18N) {
      var v = window.__GM_I18N.t(key, vars);
      if (v) return v;
    }
    return null;
  }

  function readStore() {
    try {
      var v = parseInt(sessionStorage.getItem(STORE), 10);
      return (v >= MIN && v <= MAX) ? v : null;
    } catch (err) { return null; }
  }

  function writeStore(v) {
    try {
      if (v === null) sessionStorage.removeItem(STORE);
      else sessionStorage.setItem(STORE, String(v));
    } catch (err) { /* private mode */ }
  }

  function lineFor(year) {
    if (birth === null) return null;
    var age = year - birth;
    if (age < 0) return i18n('wy.nothere') || 'Not born yet';
    var tpl = i18n('wy.was') || 'You were {n}';
    return tpl.replace('{n}', String(age));
  }

  function apply() {
    var items = document.querySelectorAll('.timeline__item');
    Array.prototype.forEach.call(items, function (item) {
      var yEl = item.querySelector('.timeline__year');
      var tEl = item.querySelector('.timeline__text');
      if (!yEl || !tEl) return;
      var existing = item.querySelector('.timeline__age');
      if (existing) existing.remove();
      var line = lineFor(parseInt(yEl.textContent, 10));
      if (line === null) return;
      var p = document.createElement('p');
      p.className = 'timeline__age';
      p.textContent = line;
      tEl.insertAdjacentElement('afterend', p);
    });
    var wy = document.getElementById('whereyou');
    if (wy) wy.classList.toggle('is-on', birth !== null);
    if (input) input.value = birth === null ? '' : String(birth);
    if (clearBtn) clearBtn.hidden = birth === null;
    // age lines change the timeline height → let scroll progress re-measure
    window.dispatchEvent(new Event('resize'));
  }

  function init() {
    form = document.getElementById('wyForm');
    input = document.getElementById('wyYear');
    clearBtn = document.getElementById('wyClear');
    if (!form || !input || !clearBtn) return;

    birth = readStore();
    if (birth !== null) apply();

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = parseInt(input.value, 10);
      if (!v || v < MIN || v > MAX) {
        input.classList.remove('shake');
        void input.offsetWidth;
        input.classList.add('shake');
        input.focus();
        return;
      }
      birth = v;
      writeStore(birth);
      apply();
    });

    clearBtn.addEventListener('click', function () {
      birth = null;
      writeStore(null);
      apply();
    });

    document.addEventListener('gm:lang', function () {
      if (birth !== null) apply();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
