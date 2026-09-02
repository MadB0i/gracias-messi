/* ui.js — scroll experience + playful layer.
   Ink progress line along the red margin + page number,
   sticky chapter-dot nav, reveal-on-scroll, self-drawing timeline,
   "GOAT" easter egg, GOOOAL paper confetti.
   One rAF-throttled scroll handler drives everything scroll-bound.
   Zero dependencies. Honors prefers-reduced-motion. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var docEl = document.documentElement;

  /* ══════════ 1. SCROLL PROGRESS + PAGE NUMBER ══════════ */

  var progressFill = null, pageNoEl = null;
  var sectionTops = [], docH = 0, winH = 0, curPg = 0;

  function buildProgress() {
    var track = document.createElement('div');
    track.className = 'ink-progress';
    track.setAttribute('aria-hidden', 'true');
    progressFill = document.createElement('div');
    progressFill.className = 'ink-progress__fill';
    track.appendChild(progressFill);
    document.body.appendChild(track);

    pageNoEl = document.createElement('div');
    pageNoEl.className = 'page-no';
    pageNoEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(pageNoEl);
  }

  /* ══════════ 2. CHAPTER DOT NAV ══════════ */

  var CHAPTERS = [
    { id: 'numbers', label: 'Numbers' },
    { id: 'seasons', label: 'Seasons' },
    { id: 'moments', label: 'Moments' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'story', label: 'Story' },
    { id: 'trophies', label: 'Trophies' },
    { id: 'note', label: 'Note' }
  ];
  var navBtns = [], navTops = [], curChap = -2;

  function flash(el) {
    el.classList.remove('cmd-flash');
    void el.offsetWidth;
    el.classList.add('cmd-flash');
    setTimeout(function () { el.classList.remove('cmd-flash'); }, 1400);
  }

  function setChapter(i) {
    if (i === curChap) return;
    curChap = i;
    navBtns.forEach(function (b, j) {
      b.classList.toggle('on', j === i);
      if (j === i) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }

  function buildNav() {
    var navEl = document.createElement('nav');
    navEl.className = 'chapnav';
    navEl.setAttribute('aria-label', 'Sections');
    CHAPTERS.forEach(function (ch, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chapnav__dot';
      b.setAttribute('aria-label', 'Jump to ' + ch.label);
      b.innerHTML = '<span class="chapnav__label">' + ch.label + '</span>';
      b.addEventListener('click', function () {
        var t = document.getElementById(ch.id);
        if (!t) return;
        t.scrollIntoView({ block: 'start' });
        flash(t);
        setChapter(i);
      });
      navEl.appendChild(b);
      navBtns.push(b);
    });
    document.body.appendChild(navEl);
  }

  /* ══════════ 4. TIMELINE SELF-DRAW ══════════ */

  var tlFill = null, tlTop = 0, tlH = 0;

  function buildTimelineFill() {
    var trackEl = document.querySelector('.timeline__track');
    if (!trackEl) return;
    tlFill = document.createElement('span');
    tlFill.className = 'timeline__fill';
    tlFill.setAttribute('aria-hidden', 'true');
    trackEl.insertBefore(tlFill, trackEl.firstChild);
    if (reduceMotion) tlFill.style.height = '100%';
  }

  /* ══════════ 3. REVEAL-ON-SCROLL ══════════ */

  function setupReveal() {
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    var sectionSel = '.stats, .chart-section, .heat-section, .cards, .gallery, .timeline, .bio, .trophies, .note, .ownnote';
    var staggerSel = { sel: '.stats .stat, .cards .card-btn, .trophies .trophies__group, .gallery__grid .tilt-card', step: 70 };
    var slowSel = { sel: '.timeline__item, .bio__chapter', step: 0 };
    var targets = [];

    function mark(selector, step) {
      var els = document.querySelectorAll(selector);
      Array.prototype.forEach.call(els, function (el, i) {
        el.classList.add('rv');
        if (step) el.style.setProperty('--rv-delay', Math.min(i * step, 420) + 'ms');
        targets.push(el);
      });
    }

    mark(sectionSel, 0);
    mark(staggerSel.sel, staggerSel.step);
    mark(slowSel.sel, slowSel.step);

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (el) { io.observe(el); });

    // Safety net: never let in-view content stay hidden if the observer
    // misfires. After load (or a fallback delay), reveal anything already
    // on screen that the observer hasn't marked yet.
    function safety() {
      var vh = window.innerHeight;
      targets.forEach(function (el) {
        if (el.classList.contains('rv-in')) return;
        var r = el.getBoundingClientRect();
        if (r.top < vh * 0.94 && r.bottom > 0) el.classList.add('rv-in');
      });
    }
    // Runs twice (idempotent): once after load settles, once as a hard
    // fallback in case the load listener races or is missed.
    window.addEventListener('load', function () { setTimeout(safety, 400); });
    setTimeout(safety, 2500);
  }

  /* ══════════ 6. "GOAT" EASTER EGG ══════════ */

  var goatOn = false, keyBuf = '', toastEl = null, toastTimer = null;

  function buildToast() {
    toastEl = document.createElement('div');
    toastEl.className = 'goat-toast';
    toastEl.setAttribute('aria-hidden', 'true');
    document.body.appendChild(toastEl);
  }

  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add('on');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('on'); }, 1900);
  }

  function toggleGoat() {
    var block = document.querySelector('.hero .ink-block');
    if (!block) return;
    var line = block.querySelector('.ink-line');
    var real = line ? line.querySelector('.ink-real') : null;
    var toGoat = !goatOn;
    goatOn = toGoat;
    var text = toGoat ? 'goat' : 'Gracias, Argentina';
    if (line) line.setAttribute('data-text', text);
    if (real) real.textContent = text;
    block.setAttribute('aria-label', text);
    toast(toGoat ? 'Exactly.' : 'Back to the shirt.');
    if (window.__GM_INK && window.__GM_INK.redraw) window.__GM_INK.redraw(block);
  }

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) { keyBuf = ''; return; }
    var ae = document.activeElement;
    var tag = ae ? ae.tagName : '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || (ae && ae.isContentEditable)) return;
    var k = (e.key || '').toLowerCase();
    if (k.length !== 1 || k < 'a' || k > 'z') return;
    keyBuf = (keyBuf + k).slice(-4);
    if (keyBuf === 'goat') {
      keyBuf = '';
      toggleGoat();
    }
  });

  /* ══════════ 7. GOOOAL BUTTON + CONFETTI ══════════ */

  var goalBtn = null, goalCountEl = null, goalN = 0;

  function buildGoal() {
    try { goalN = parseInt(sessionStorage.getItem('gm-goals') || '0', 10) || 0; } catch (err) { goalN = 0; }
    goalBtn = document.createElement('button');
    goalBtn.type = 'button';
    goalBtn.className = 'goal-btn';
    goalBtn.setAttribute('data-cmd', 'Celebrate a goal');
    goalBtn.setAttribute('data-cmd-sub', 'paper confetti, your own tally');
    goalBtn.setAttribute('aria-label', 'Celebrate a goal');
    goalBtn.innerHTML =
      '<span class="goal-btn__ball" aria-hidden="true"></span>' +
      '<span class="goal-btn__label">GOOOAL</span>' +
      '<span class="goal-btn__count" hidden></span>';
    goalCountEl = goalBtn.querySelector('.goal-btn__count');
    if (goalN > 0) paintCount();
    goalBtn.addEventListener('click', function () {
      goalN++;
      try { sessionStorage.setItem('gm-goals', String(goalN)); } catch (err) { /* private mode */ }
      paintCount();
      goalBtn.classList.remove('pop');
      void goalBtn.offsetWidth;
      goalBtn.classList.add('pop');
      if (!reduceMotion) confetti();
    });
    document.body.appendChild(goalBtn);
  }

  function paintCount() {
    if (!goalCountEl) return;
    goalCountEl.textContent = goalN;
    goalCountEl.hidden = false;
  }

  var cv = null, ctx = null, pieces = [], running = false;

  function ensureCanvas() {
    if (cv) return true;
    cv = document.createElement('canvas');
    cv.className = 'confetti-cv';
    cv.setAttribute('aria-hidden', 'true');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.floor(window.innerWidth * dpr);
    cv.height = Math.floor(window.innerHeight * dpr);
    ctx = cv.getContext('2d');
    if (!ctx) { cv = null; return false; }
    ctx.scale(dpr, dpr);
    document.body.appendChild(cv);
    return true;
  }

  function confetti() {
    if (reduceMotion) return;
    if (!ensureCanvas()) return;
    var W = window.innerWidth;
    var H = window.innerHeight;
    var colors = ['#75AADB', '#75AADB', '#F7F3E8', '#FFFFFF', '#C5A55A', '#1A2744'];
    for (var i = 0; i < 80; i++) {
      pieces.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H * 0.2,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 9,
        vy: 2.4 + Math.random() * 3,
        vx: (Math.random() - 0.5) * 1.4,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.25,
        sway: Math.random() * Math.PI * 2,
        sw: 0.02 + Math.random() * 0.04,
        c: colors[(Math.random() * colors.length) | 0]
      });
    }
    if (!running) {
      running = true;
      requestAnimationFrame(step);
    }
  }

  function step() {
    var W = window.innerWidth;
    var H = window.innerHeight;
    ctx.clearRect(0, 0, W, H);
    var alive = [];
    for (var i = 0; i < pieces.length; i++) {
      var p = pieces[i];
      p.sway += p.sw;
      p.x += p.vx + Math.sin(p.sway) * 0.8;
      p.y += p.vy;
      p.rot += p.vr;
      p.vy = Math.min(p.vy + 0.02, 6);
      if (p.y < H + 40) {
        alive.push(p);
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    }
    pieces = alive;
    if (pieces.length) {
      requestAnimationFrame(step);
    } else {
      running = false;
      if (cv && cv.parentNode) cv.parentNode.removeChild(cv);
      cv = null;
      ctx = null;
    }
  }

  /* ══════════ SCROLL MACHINERY (one handler) ══════════ */

  function measure() {
    winH = window.innerHeight;
    docH = docEl.scrollHeight;
    var sections = document.querySelectorAll('section');
    sectionTops = Array.prototype.map.call(sections, function (s) {
      return s.getBoundingClientRect().top + window.scrollY;
    });
    navTops = CHAPTERS.map(function (c) {
      var el = document.getElementById(c.id);
      return el ? el.getBoundingClientRect().top + window.scrollY : Infinity;
    });
    var trackEl = document.querySelector('.timeline__track');
    if (trackEl) {
      var r = trackEl.getBoundingClientRect();
      tlTop = r.top + window.scrollY;
      tlH = r.height;
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    var y = window.scrollY || docEl.scrollTop;
    var max = docH - winH;
    if (progressFill) {
      var f = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
      progressFill.style.transform = 'scaleY(' + f.toFixed(4) + ')';
    }
    if (pageNoEl) {
      var pg = 1;
      for (var i = 0; i < sectionTops.length; i++) {
        if (y + winH * 0.5 >= sectionTops[i]) pg = i + 1;
      }
      if (pg !== curPg) {
        curPg = pg;
        pageNoEl.textContent = 'p. ' + pg + ' / ' + sectionTops.length;
      }
    }
    if (tlFill && !reduceMotion && tlH > 0) {
      var p = (y + winH * 0.5 - tlTop) / tlH;
      p = p < 0 ? 0 : (p > 1 ? 1 : p);
      tlFill.style.height = (p * 100).toFixed(2) + '%';
    }
    if (navBtns.length) {
      var act = -1;
      for (var j = 0; j < navTops.length; j++) {
        if (navTops[j] !== Infinity && y + winH * 0.38 >= navTops[j]) act = j;
      }
      if (y + winH >= docH - 4) act = navTops.length - 1;
      setChapter(act);
    }
  }

  function init() {
    buildProgress();
    buildNav();
    buildTimelineFill();
    setupReveal();
    buildToast();
    buildGoal();
    measure();
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });
    window.addEventListener('load', function () { measure(); update(); });
  }

  // Public API — other modules (e.g. the Wall) can fire a confetti burst.
  window.__GM_CONFETTI = confetti;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
