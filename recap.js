/* recap.js — "Generate my recap". Draws a ~15 s vertical (1080x1920)
   recap of the stat counters, trophy case and timeline on an
   offscreen canvas in real time, captures it with
   canvas.captureStream() + MediaRecorder, and offers a downloadable
   .webm sized for Reels/Shorts/Stories. Vanilla JS, zero dependencies,
   100% client-side — nothing is uploaded. Canvas + recorder are only
   created on click (no first-paint cost). Fails gracefully with a
   message where MediaRecorder/captureStream is missing (some iOS).
   Data is read from the rendered page (single source:
   messi-career.json), never hardcoded here. */
(function () {
  'use strict';

  var W = 1080, H = 1920;
  var DURATION = 15000;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var C = {
    cream: '#F5F0E1',
    line: 'rgba(140,160,185,0.20)',
    margin: 'rgba(200,80,80,0.30)',
    navy: '#1A2744',
    blue: '#75AADB',
    blueDeep: '#3D7AB5',
    gold: '#C5A55A',
    ink: '#2C3E50'
  };
  var BEBAS = '"Bebas Neue","Arial Narrow",sans-serif';
  var CAVEAT = '"Caveat",cursive';
  var WORK = '"Work Sans",sans-serif';

  var btn, progress, bar, pct, recapBox;
  var busy = false;
  var lastUrl = null;

  // ── data from the rendered page ──────────────────────────────
  function collect() {
    var stats = [];
    Array.prototype.forEach.call(document.querySelectorAll('.stats .stat'), function (el) {
      if (el.id === 'starStat') return;
      var num = el.querySelector('.stat__number');
      var desc = el.querySelector('.stat__desc');
      if (num && desc && num.getAttribute('data-target')) {
        stats.push({ n: parseInt(num.getAttribute('data-target'), 10), label: desc.textContent.trim() });
      }
    });
    var clubs = [];
    Array.prototype.forEach.call(document.querySelectorAll('.trophies__group'), function (g) {
      var count = g.querySelector('.trophies__count');
      var club = g.querySelector('.trophies__club');
      if (!count || !club) return;
      var name = club.textContent.replace(count.textContent, '').replace(/\s+/g, ' ').trim();
      clubs.push({ n: parseInt(count.textContent, 10) || 0, name: name });
    });
    var miles = [];
    Array.prototype.forEach.call(document.querySelectorAll('.timeline__item--milestone'), function (it) {
      var y = it.querySelector('.timeline__year');
      var t = it.querySelector('.timeline__text');
      if (!y || !t) return;
      var txt = t.textContent.replace(/\s+/g, ' ').trim();
      miles.push({ year: y.textContent.trim(), text: txt.length > 72 ? txt.slice(0, 69) + '…' : txt });
    });
    return { stats: stats, clubs: clubs, miles: miles.slice(0, 4) };
  }

  // ── drawing helpers ──────────────────────────────────────────
  function clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
  function easeOut(t) { return 1 - Math.pow(1 - clamp01(t), 3); }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function fmt(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  function paper(ctx) {
    ctx.fillStyle = C.cream;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = C.line;
    ctx.lineWidth = 2;
    for (var y = 120; y < H; y += 84) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.strokeStyle = C.margin;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(150, H);
    ctx.stroke();
  }

  function watermark(ctx) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = C.navy;
    ctx.font = '400 560px ' + BEBAS;
    ctx.textAlign = 'right';
    ctx.fillText('10', W - 30, H - 50);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  function wrapCenter(ctx, text, x, y, maxW, lh) {
    var words = text.split(' ');
    var line = '';
    var yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  function wrapLeft(ctx, text, x, y, maxW, lh) {
    var words = text.split(' ');
    var line = '';
    var yy = y;
    for (var i = 0; i < words.length; i++) {
      var test = line ? line + ' ' + words[i] : words[i];
      if (ctx.measureText(test).width > maxW && line) {
        ctx.fillText(line, x, yy);
        line = words[i];
        yy += lh;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line, x, yy);
  }

  // ── scenes (t in seconds) ────────────────────────────────────
  function sceneTitle(ctx, t) {
    var k = easeOut(seg(t, 0.05, 1.0));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.navy;
    ctx.font = '400 200px ' + BEBAS;
    ctx.fillText('LIONEL', W / 2 + 20, 660);
    ctx.fillText('MESSI', W / 2 + 20, 860);
    ctx.fillStyle = C.blueDeep;
    ctx.font = '600 110px ' + CAVEAT;
    ctx.fillText('Gracias, Argentina', W / 2 + 20, 1030);
    ctx.fillStyle = C.ink;
    ctx.font = '500 46px ' + WORK;
    ctx.globalAlpha = k * 0.6;
    ctx.fillText('August 31, 2026', W / 2 + 20, 1150);
    ctx.restore();
  }

  function sceneStats(ctx, t, stats) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.navy;
    ctx.font = '400 110px ' + BEBAS;
    var hk = easeOut(seg(t, 2.25, 2.7));
    ctx.globalAlpha = hk;
    ctx.fillText('THE NUMBERS', W / 2, 260);
    var x0 = 215, y0 = 480, cw = 320, ch = 340;
    for (var i = 0; i < stats.length && i < 6; i++) {
      var s = stats[i];
      var start = 2.6 + i * 0.7;
      var k = seg(t, start, start + 0.25);
      if (k <= 0) continue;
      var cx = x0 + (i % 2) * cw + cw / 2;
      var cy = y0 + Math.floor(i / 2) * ch;
      var shown = reduce ? s.n : Math.round(easeOut(seg(t, start, start + 1.2)) * s.n);
      ctx.globalAlpha = k;
      ctx.fillStyle = C.navy;
      ctx.font = '400 150px ' + BEBAS;
      ctx.fillText(fmt(shown), cx, cy);
      ctx.globalAlpha = k * 0.75;
      ctx.fillStyle = C.ink;
      ctx.font = '500 44px ' + WORK;
      wrapCenter(ctx, s.label, cx, cy + 70, 270, 50);
    }
    ctx.restore();
  }

  function sceneTrophies(ctx, t, clubs) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.navy;
    ctx.font = '400 110px ' + BEBAS;
    ctx.globalAlpha = easeOut(seg(t, 8.45, 8.9));
    ctx.fillText('47 TROPHIES', W / 2, 260);
    var y = 500;
    for (var i = 0; i < clubs.length; i++) {
      var c = clubs[i];
      var start = 8.9 + i * 0.68;
      var k = seg(t, start, start + 0.22);
      if (k <= 0) continue;
      var shown = reduce ? c.n : Math.round(easeOut(seg(t, start, start + 0.9)) * c.n);
      ctx.globalAlpha = k;
      ctx.fillStyle = C.gold;
      ctx.font = '400 110px ' + BEBAS;
      ctx.textAlign = 'left';
      ctx.fillText(String(shown), 220, y);
      ctx.fillStyle = C.ink;
      ctx.font = '500 58px ' + WORK;
      ctx.fillText(c.name, 400, y - 10);
      ctx.strokeStyle = 'rgba(140,160,185,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(220, y + 40);
      ctx.lineTo(W - 120, y + 40);
      ctx.stroke();
      y += 210;
    }
    ctx.restore();
  }

  function sceneMiles(ctx, t, miles) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = C.navy;
    ctx.font = '400 100px ' + BEBAS;
    ctx.globalAlpha = easeOut(seg(t, 11.95, 12.4));
    ctx.fillText('A LIFE IN THE GAME', W / 2, 250);
    var y = 460;
    for (var i = 0; i < miles.length; i++) {
      var m = miles[i];
      var start = 12.3 + i * 0.4;
      var k = seg(t, start, start + 0.2);
      if (k <= 0) continue;
      ctx.globalAlpha = k;
      ctx.fillStyle = C.blue;
      ctx.font = '400 84px ' + BEBAS;
      ctx.textAlign = 'left';
      ctx.fillText(m.year, 190, y);
      ctx.fillStyle = C.ink;
      ctx.font = '500 44px ' + WORK;
      wrapLeft(ctx, m.text, 430, y - 28, 500, 52);
      y += 240;
    }
    ctx.restore();
  }

  function sceneOutro(ctx, t) {
    var k = easeOut(seg(t, 13.95, 14.6));
    ctx.save();
    ctx.globalAlpha = k;
    ctx.textAlign = 'center';
    ctx.fillStyle = C.blueDeep;
    ctx.font = '600 150px ' + CAVEAT;
    ctx.fillText('Gracias, Argentina.', W / 2, 900);
    ctx.fillStyle = C.ink;
    ctx.globalAlpha = k * 0.55;
    ctx.font = '500 44px ' + WORK;
    ctx.fillText('github.com/MadB0i/gracias-messi', W / 2, 1040);
    ctx.restore();
  }

  function drawFrame(ctx, t, data) {
    paper(ctx);
    if (t < 2.2) sceneTitle(ctx, t);
    else if (t < 8.4) sceneStats(ctx, t, data.stats);
    else if (t < 11.9) sceneTrophies(ctx, t, data.clubs);
    else if (t < 13.9) sceneMiles(ctx, t, data.miles);
    else sceneOutro(ctx, t);
    watermark(ctx);
  }

  // ── recorder ─────────────────────────────────────────────────
  function pickMime() {
    var list = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    for (var i = 0; i < list.length; i++) {
      try {
        if (MediaRecorder.isTypeSupported(list[i])) return list[i];
      } catch (err) { /* try next */ }
    }
    return '';
  }

  function t2(key, fallback) {
    if (window.__GM_I18N) {
      var v = window.__GM_I18N.t(key);
      if (v) return v;
    }
    return fallback;
  }

  function chip(msg, isError, href) {
    var old = recapBox.querySelector('.recap__chip');
    if (old) old.remove();
    var e = document.createElement(href ? 'a' : 'div');
    e.className = 'recap__chip' + (isError ? ' recap__chip--error' : '');
    if (href) {
      e.href = href;
      e.download = 'gracias-messi-recap.webm';
    }
    e.textContent = msg;
    recapBox.appendChild(e);
  }

  function setUi(state, extra) {
    var cta = btn.querySelector('.recap__cta');
    if (state === 'recording') {
      btn.disabled = true;
      cta.textContent = t2('recap.recording', 'Recording… keep this tab open');
      progress.hidden = false;
      bar.style.width = '0%';
      pct.textContent = '0%';
      var old = recapBox.querySelector('.recap__chip');
      if (old) old.remove();
    } else if (state === 'done') {
      btn.disabled = false;
      cta.textContent = t2('recap.cta', 'Generate my recap');
      progress.hidden = true;
      chip((t2('recap.saved', 'Done — your video downloaded. Share it.') + '  ⬇ ' +
        (extra ? Math.round(extra / (1024 * 1024) * 10) / 10 + ' MB' : '')), false, lastUrl);
    } else if (state === 'error') {
      btn.disabled = false;
      cta.textContent = t2('recap.cta', 'Generate my recap');
      progress.hidden = true;
      chip(t2('recap.unsupported', 'This browser can’t record video (MediaRecorder missing). Try desktop Chrome, Edge or Firefox.'), true, null);
    } else {
      btn.disabled = false;
      cta.textContent = t2('recap.cta', 'Generate my recap');
      progress.hidden = true;
    }
  }

  function start() {
    if (busy) return;
    var canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    var ctx2d = canvas.getContext('2d');
    if (!ctx2d || typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      setUi('error');
      return;
    }
    busy = true;
    setUi('recording');

    var data = collect();
    var stream = canvas.captureStream(30);
    var mime = pickMime();
    var rec;
    try {
      rec = new MediaRecorder(stream, mime ? { mimeType: mime, videoBitsPerSecond: 8000000 } : undefined);
    } catch (err) {
      busy = false;
      stream.getTracks().forEach(function (tr) { tr.stop(); });
      setUi('error');
      return;
    }

    var chunks = [];
    rec.ondataavailable = function (e) {
      if (e.data && e.data.size) chunks.push(e.data);
    };
    rec.onstop = function () {
      var blob = new Blob(chunks, { type: 'video/webm' });
      if (lastUrl) URL.revokeObjectURL(lastUrl);
      lastUrl = URL.createObjectURL(blob);
      busy = false;
      // auto-download + keep a re-download chip
      var a = document.createElement('a');
      a.href = lastUrl;
      a.download = 'gracias-messi-recap.webm';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setUi('done', blob.size);
    };
    rec.onerror = function () {
      busy = false;
      stream.getTracks().forEach(function (tr) { tr.stop(); });
      setUi('error');
    };

    var fontReady = (document.fonts && document.fonts.ready)
      ? Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })])
      : Promise.resolve();

    fontReady.then(function () {
      drawFrame(ctx2d, 0, data); // paint first frame before capture starts
      rec.start(250);
      var t0 = performance.now();
      (function frame() {
        var elapsed = performance.now() - t0;
        var t = Math.min(elapsed / 1000, DURATION / 1000);
        drawFrame(ctx2d, t, data);
        var p = clamp01(elapsed / DURATION);
        bar.style.width = (p * 100).toFixed(1) + '%';
        pct.textContent = Math.round(p * 100) + '%';
        if (elapsed < DURATION) {
          requestAnimationFrame(frame);
        } else {
          setTimeout(function () {
            rec.stop();
            stream.getTracks().forEach(function (tr) { tr.stop(); });
          }, 200);
        }
      })();
    });
  }

  function init() {
    btn = document.getElementById('recapBtn');
    progress = document.getElementById('recapProgress');
    bar = document.getElementById('recapBar');
    pct = document.getElementById('recapPct');
    recapBox = document.querySelector('.recap');
    if (!btn || !recapBox) return;
    btn.addEventListener('click', start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
