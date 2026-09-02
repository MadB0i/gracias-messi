/* pageflip.js — page-turn navigation between the 5 bio chapters.
   Wraps the existing .bio__chapter articles in a 3D stage and turns
   them like notebook pages (perspective + rotateY, hinge at the left
   edge). Navigate by scroll (wheel: page advances only when the
   current page's inner scroll is at its end), touch swipe, arrow
   keys, dots, or prev/next buttons. Only affects the bio section.
   prefers-reduced-motion → instant cut. Re-measures the page layout
   afterwards (dispatches resize) so scroll progress stays accurate. */
(function () {
  'use strict';

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var T = reduce ? 0 : 560;

  var section, stage, chromeEl;
  var pages = [];
  var dots = [];
  var prevBtn, nextBtn, countEl, live;
  var cur = 0, turning = false, inView = false, lastNav = 0;

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function roman(i) {
    var n = pages[i] ? pages[i].querySelector('.bio__chapter-num') : null;
    return n ? n.textContent.trim() : String(i + 1);
  }

  function updateChrome() {
    dots.forEach(function (d, i) {
      d.classList.toggle('is-on', i === cur);
      d.setAttribute('aria-selected', i === cur ? 'true' : 'false');
    });
    if (prevBtn) prevBtn.disabled = cur === 0;
    if (nextBtn) nextBtn.disabled = cur === pages.length - 1;
    if (countEl) countEl.textContent = roman(cur) + ' / ' + roman(pages.length - 1);
    if (live) {
      var title = pages[cur].querySelector('.bio__chapter-title');
      live.textContent = 'Chapter ' + (cur + 1) + ' of ' + pages.length +
        (title ? ': ' + title.textContent : '');
    }
  }

  function go(n) {
    if (turning || n === cur || n < 0 || n >= pages.length) return;
    var now = Date.now();
    if (now - lastNav < (T + 80)) return;
    lastNav = now;
    var dir = n > cur ? 1 : -1;
    turning = true;
    pages.forEach(function (p, i) {
      p.classList.remove('is-out-l', 'is-out-r', 'is-in-r', 'is-in-l');
      if (i === cur) p.classList.add(dir === 1 ? 'is-out-l' : 'is-out-r');
      if (i === n) p.classList.add(dir === 1 ? 'is-in-r' : 'is-in-l');
    });
    cur = n;
    updateChrome();
    setTimeout(function () {
      pages.forEach(function (p, i) {
        p.classList.remove('is-out-l', 'is-out-r', 'is-in-r', 'is-in-l');
        p.classList.toggle('is-active', i === cur);
        p.setAttribute('aria-hidden', i === cur ? 'false' : 'true');
        if (i === cur) p.scrollTop = 0;
      });
      turning = false;
    }, T);
  }

  function build() {
    section = document.querySelector('.bio');
    if (!section) return;
    var chapters = Array.prototype.slice.call(section.querySelectorAll('.bio__chapter'));
    if (chapters.length < 2) return;

    section.querySelectorAll('.bio__divider').forEach(function (d) { d.remove(); });

    var anchor = el('div');
    section.insertBefore(anchor, chapters[0]);

    stage = el('div', 'pageflip');
    var st = el('div', 'pageflip__stage');
    st.setAttribute('role', 'group');
    st.setAttribute('aria-roledescription', 'paged story');
    st.setAttribute('aria-label', 'Biography — one chapter per page');

    chapters.forEach(function (ch, i) {
      var page = el('div', 'pageflip__page' + (i === 0 ? ' is-active' : ''));
      page.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      page.appendChild(ch);
      st.appendChild(page);
      pages.push(page);
    });
    stage.appendChild(st);

    chromeEl = el('div', 'pageflip__chrome');
    prevBtn = el('button', 'pageflip__nav', '‹');
    prevBtn.type = 'button';
    prevBtn.setAttribute('aria-label', 'Previous chapter');
    prevBtn.addEventListener('click', function () { go(cur - 1); });

    var dotsWrap = el('div', 'pageflip__dots');
    dotsWrap.setAttribute('role', 'tablist');
    dotsWrap.setAttribute('aria-label', 'Chapters');
    chapters.forEach(function (ch, i) {
      var d = el('button', 'pageflip__dot');
      d.type = 'button';
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-label', 'Chapter ' + (i + 1));
      d.addEventListener('click', function () { go(i); });
      dotsWrap.appendChild(d);
      dots.push(d);
    });

    nextBtn = el('button', 'pageflip__nav', '›');
    nextBtn.type = 'button';
    nextBtn.setAttribute('aria-label', 'Next chapter');
    nextBtn.addEventListener('click', function () { go(cur + 1); });

    countEl = el('div', 'pageflip__count');
    live = el('div', 'sr-only');
    live.setAttribute('aria-live', 'polite');

    chromeEl.appendChild(prevBtn);
    chromeEl.appendChild(dotsWrap);
    chromeEl.appendChild(nextBtn);
    chromeEl.appendChild(countEl);
    chromeEl.appendChild(live);
    stage.appendChild(chromeEl);

    section.replaceChild(stage, anchor);
    updateChrome();

    // ── wheel: advance only when inner scroll is at its end ──
    st.addEventListener('wheel', function (e) {
      if (!inView || turning) return;
      var pg = pages[cur];
      var atStart = pg.scrollTop <= 0;
      var atEnd = pg.scrollTop + pg.clientHeight >= pg.scrollHeight - 2;
      if (e.deltaY > 14 && atEnd && cur < pages.length - 1) {
        e.preventDefault();
        go(cur + 1);
      } else if (e.deltaY < -14 && atStart && cur > 0) {
        e.preventDefault();
        go(cur - 1);
      }
    }, { passive: false });

    // ── touch swipe ──
    var tx = 0, ty = 0;
    st.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
    }, { passive: true });
    st.addEventListener('touchend', function (e) {
      var t = e.changedTouches[0];
      if (!t) return;
      var dx = t.clientX - tx, dy = t.clientY - ty;
      if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        go(cur + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });

    // ── arrow keys (only while the stage is on screen, not typing) ──
    document.addEventListener('keydown', function (e) {
      if (!inView) return;
      if (turning) return;
      var ae = document.activeElement;
      var tag = ae ? ae.tagName : '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (ae && ae.isContentEditable)) return;
      var cmdk = document.querySelector('.cmdk');
      if (cmdk && !cmdk.hidden) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); go(cur - 1); }
    });

    // ── track on-screen presence for keys/wheel ──
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        inView = entries[0].isIntersecting;
      }, { threshold: 0.2 });
      io.observe(stage);
    } else {
      inView = true;
    }

    // Layout changed (stacked chapters → fixed-height stage): re-measure.
    window.dispatchEvent(new Event('resize'));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
