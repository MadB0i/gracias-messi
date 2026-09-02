/* sketch.js — triggers the margin doodle (margin-sketch) stroke reveal
   when the closing note scrolls into view. One-time trigger via
   IntersectionObserver, reusing the exact stroke-reveal system from
   ink.js (window.__GM_INK.sketch) — same dash-offset animation, same
   easing, one shared nib. No second animation system. */
(function () {
  'use strict';

  function init() {
    var targets = document.querySelectorAll('[data-sketch]');
    if (!targets.length) return;

    // If the ink module is missing (shouldn't happen), leave fully drawn.
    if (!window.__GM_INK || !window.__GM_INK.sketch) return;

    function fire(el) {
      window.__GM_INK.sketch(el);
    }

    if (!('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(targets, fire);
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          fire(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });

    Array.prototype.forEach.call(targets, function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
