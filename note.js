/* note.js — "write your own note". Client-side only.
   Renders the visitor's text onto notebook paper via Canvas at two
   social sizes (1080×1350 Instagram, 1200×675 Twitter). Last note
   restored from sessionStorage as a convenience. */
(function () {
  'use strict';

  var MAX = 220;
  var KEY = 'gm-last-note';
  var REPO = 'https://github.com/MadB0i/gracias-messi';

  var ta, counter, btnIg, btnTw, starCta, saved;

  function init() {
    var box = document.getElementById('noteTool');
    if (!box) return;
    ta = box.querySelector('#noteText');
    counter = box.querySelector('#noteCount');
    btnIg = box.querySelector('#dlIg');
    btnTw = box.querySelector('#dlTw');
    starCta = box.querySelector('.star-cta');

    ta.setAttribute('maxlength', MAX);
    saved = safeGet();
    if (saved) ta.value = saved;
    update();

    ta.addEventListener('input', function () {
      update();
      debSave();
    });

    btnIg.addEventListener('click', function () { download(1080, 1350, true); });
    btnTw.addEventListener('click', function () { download(1200, 675, false); });
  }

  function safeGet() {
    try { return sessionStorage.getItem(KEY) || ''; } catch (e) { return ''; }
  }
  var t;
  function debSave() {
    clearTimeout(t);
    t = setTimeout(function () {
      try { sessionStorage.setItem(KEY, ta.value); } catch (e) { /* private mode */ }
    }, 400);
  }

  function update() {
    var n = ta.value.length;
    counter.textContent = n + ' / ' + MAX;
    var empty = n === 0;
    btnIg.disabled = empty;
    btnTw.disabled = empty;
  }

  function loadFont(px) {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return document.fonts.load('600 ' + px + 'px Caveat').then(
      function () { return document.fonts.load('400 ' + Math.round(px * 0.4) + 'px "Work Sans"'); },
      function () { /* timeout guard below */ }
    );
  }

  function wrap(ctx, text, maxW) {
    var words = text.split(/\s+/).filter(Boolean);
    var lines = [], cur = '';
    words.forEach(function (w) {
      var test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = test;
      }
    });
    if (cur) lines.push(cur);
    return lines;
  }

  function render(w, h, portrait) {
    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    var c = canvas.getContext('2d');

    // paper
    c.fillStyle = '#F5F0E1';
    c.fillRect(0, 0, w, h);

    // ruled lines + red margin (same geometry as the page)
    var lineH = portrait ? 96 : 78;
    var top = portrait ? 252 : 168;
    c.strokeStyle = 'rgba(140,160,185,0.20)';
    c.lineWidth = 2;
    for (var y = top; y < h - (portrait ? 150 : 100); y += lineH) {
      c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke();
    }
    var mx = Math.round(w * 0.085);
    c.strokeStyle = 'rgba(200,80,80,0.28)';
    c.beginPath(); c.moveTo(mx, 0); c.lineTo(mx, h); c.stroke();

    // header
    c.fillStyle = '#3D7AB5';
    c.font = '500 ' + (portrait ? 58 : 46) + 'px Caveat, cursive';
    c.fillText('a note for leo', mx + 30, top - 60);
    c.fillStyle = 'rgba(44,62,80,0.45)';
    c.font = '400 ' + (portrait ? 30 : 26) + 'px "Work Sans", sans-serif';
    c.fillText('August 31, 2026 — gracias, argentina', mx + 32, top - 18);

    // the note, wrapped, fitted to the rules
    var left = mx + 30, maxW = w - left - (portrait ? 90 : 70);
    var maxLines = Math.floor((h - (portrait ? 170 : 115) - top) / lineH);
    var sizes = portrait ? [64, 56, 50, 44] : [48, 42, 36, 32];
    var text = ta.value;
    var i = 0;
    while (i < sizes.length) {
      var px = sizes[i];
      c.font = '600 ' + px + 'px Caveat, cursive';
      var lines = wrap(c, text, maxW);
      if (lines.length <= maxLines || i === sizes.length - 1) {
        c.fillStyle = '#1e2f56';
        var firstY = top + px * 0.8;
        lines.slice(0, maxLines).forEach(function (ln, k) {
          c.fillText(ln, left, firstY + k * lineH);
        });
        break;
      }
      i++;
    }

    // watermark + provenance line
    var footY = h - (portrait ? 78 : 48);
    c.fillStyle = 'rgba(26,39,68,0.4)';
    c.font = '500 ' + (portrait ? 34 : 28) + 'px Caveat, cursive';
    c.fillText('gracias-messi — a fan tribute', left, footY);
    c.fillStyle = 'rgba(44,62,80,0.38)';
    c.font = '400 ' + (portrait ? 26 : 22) + 'px "Work Sans", sans-serif';
    c.fillText('github.com/MadB0i/gracias-messi · fan-made — these words are yours, not Messi\'s', left, footY + (portrait ? 42 : 34));

    return canvas;
  }

  function download(w, h, portrait) {
    if (!ta.value) return;
    loadFont(Math.round(w / 17)).then(function () {
      var canvas = render(w, h, portrait);
      var a = document.createElement('a');
      a.download = portrait ? 'my-note-for-leo-instagram.png' : 'my-note-for-leo-twitter.png';
      a.href = canvas.toDataURL('image/png');
      a.click();
      if (starCta) starCta.classList.add('on');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
