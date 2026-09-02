/* ink.js — handwriting + margin-sketch stroke reveal.
   Layout-correct by construction: each .ink-line keeps the REAL webfont
   text (.ink-real) in normal flow — the browser owns the width, wrapping,
   and per-character positions. The hand-drawn SVG is an absolute overlay;
   every glyph is measured against its real character's box (Range
   geometry) and scaled to fit that cell (x-height from canvas font
   metrics), so layout correctness comes from the browser's own text
   layout, never from hardcoded path coordinates. When the draw completes
   the real text fades in and the overlay fades out.
   Shared animateSequence powers the handwriting AND the margin sketch.
   prefers-reduced-motion → static real text, no SVG. */
(function () {
  'use strict';

  /* Hand-drawn monoline cursive alphabet. Local box: baseline y=100,
     x-height y=64 (36 units), ascender ~y=28, descender ~y=132.
     adv is legacy (kept for reference); placement now comes from the
     real text metrics, not these advances. */
  var A = {
    'G': { adv: 68, paths: ['M 46,44 C 36,32 20,34 14,52 C 8,72 12,94 30,101 C 40,104 48,98 48,89 C 48,80 41,75 34,79'] },
    'A': { adv: 68, paths: ['M 5,100 C 14,76 24,50 32,34 C 35,28 40,28 42,36 C 46,56 48,80 49,100', 'M 16,78 C 27,75 37,75 45,78'] },
    'I': { adv: 44, paths: ['M 12,34 C 11,58 11,84 12,100 C 16,94 24,90 33,86'] },
    'r': { adv: 56, paths: ['M 3,100 C 9,86 15,72 23,67 C 31,62 39,65 40,73 C 41,81 36,90 28,95 C 36,91 46,87 55,82'] },
    'a': { adv: 56, paths: ['M 4,100 C 10,84 16,70 24,65 C 33,61 43,66 43,77 C 43,89 34,98 26,96 C 21,94 20,88 24,84 C 28,80 34,80 38,84 C 44,90 50,94 57,88'] },
    'c': { adv: 54, paths: ['M 45,73 C 41,65 31,62 23,66 C 13,71 9,82 13,91 C 17,99 28,102 38,96 C 44,92 49,88 55,84'] },
    'i': { adv: 34, paths: ['M 6,70 C 10,65 16,63 21,65 C 27,67 29,73 27,81 C 25,89 23,95 21,100 C 25,96 33,92 43,87', 'M 17,50 L 17,55'] },
    's': { adv: 52, paths: ['M 46,71 C 41,64 31,63 26,68 C 21,73 25,78 32,80 C 39,82 43,87 39,92 C 34,98 24,99 19,94 C 15,90 15,85 17,81'] },
    'e': { adv: 54, paths: ['M 9,79 C 17,72 31,70 38,74 C 45,78 44,87 38,92 C 32,97 22,98 17,92 C 13,87 13,80 17,76 C 23,70 35,69 45,74'] },
    'n': { adv: 56, paths: ['M 4,100 C 10,84 16,70 23,66 C 31,61 39,64 39,74 C 39,84 37,93 35,100 C 39,94 47,90 55,86'] },
    't': { adv: 44, paths: ['M 31,34 C 29,54 28,80 30,97 C 34,92 42,88 52,84', 'M 17,63 C 25,61 35,61 43,63'] },
    'g': { adv: 58, paths: ['M 4,100 C 10,84 16,70 24,65 C 33,61 43,66 43,77 C 43,89 34,98 26,96 C 21,94 20,88 24,84 C 28,80 34,80 37,84 C 41,90 43,102 43,114 C 43,127 35,134 28,129 C 23,125 25,117 31,115'] },
    'v': { adv: 54, paths: ['M 3,68 C 9,79 15,91 19,100 C 25,90 31,78 37,70 C 41,65 47,66 53,72'] },
    'y': { adv: 56, paths: ['M 4,68 C 10,79 16,91 20,100 C 26,90 32,78 38,70 C 36,86 33,104 29,118 C 25,130 16,132 14,124 C 12,116 18,112 25,114'] },
    'h': { adv: 56, paths: ['M 4,100 C 10,78 15,50 19,36 C 21,28 27,27 29,35 C 32,48 32,76 31,97 C 35,91 43,87 51,83'] },
    'f': { adv: 50, paths: ['M 44,32 C 34,26 24,32 23,45 C 22,62 23,84 24,100 C 28,95 36,90 45,86', 'M 11,57 C 21,54 31,54 41,57'] },
    'o': { adv: 56, paths: ['M 40,68 C 34,62 24,62 19,68 C 12,75 12,87 18,93 C 24,100 35,99 39,92 C 43,85 42,76 39,72 C 45,79 51,84 57,84'] },
    ',': { adv: 28, paths: ['M 14,98 C 18,104 17,112 12,117 C 10,119 8,121 7,122'] },
    '.': { adv: 28, paths: ['M 14,100 L 14,105'] },
    ' ': { adv: 30, paths: [] }
  };

  var INK = '#1e2f56';
  var drawing = {}; // block element → animation in flight (guards redraw re-entrancy)
  var pendingRedraw = {}; // block element → redraw queued until current draw finishes
  var probeCanvas = null, probeCtx = null;

  /* Precompute each glyph's ink bounding box (design units). */
  function pathBBox(d) {
    var minX = Infinity, maxX = -Infinity;
    var re = /([MLC])\s*((?:-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*)+)/g;
    var m;
    while ((m = re.exec(d)) !== null) {
      var nums = m[2].trim().split(/[,\s]+/).map(Number);
      for (var n = 0; n < nums.length; n += 2) {
        if (isNaN(nums[n]) || isNaN(nums[n + 1])) continue;
        if (nums[n] < minX) minX = nums[n];
        if (nums[n] > maxX) maxX = nums[n];
      }
    }
    return { minX: minX, maxX: maxX };
  }
  var GB = {};
  (function () {
    for (var ch in A) {
      if (!A[ch].paths.length) { GB[ch] = { minX: 0, maxX: 0 }; continue; }
      var minX = Infinity, maxX = -Infinity;
      A[ch].paths.forEach(function (d) {
        var b = pathBBox(d);
        if (b.minX < minX) minX = b.minX;
        if (b.maxX > maxX) maxX = b.maxX;
      });
      GB[ch] = { minX: minX, maxX: maxX };
    }
  })();

  function jitter(i) {
    return {
      rot: (((i * 37) % 7) - 3) * 0.7,
      dy: (((i * 53) % 5) - 2) * 0.9
    };
  }

  /* ── Font metrics (real browser font, via canvas) ── */
  function probe() {
    if (!probeCanvas) {
      probeCanvas = document.createElement('canvas');
      probeCanvas.width = 1;
      probeCanvas.height = 1;
      probeCtx = probeCanvas.getContext('2d');
    }
    return probeCtx;
  }

  function fontString(cs) {
    var fam = cs.fontFamily.split(',').map(function (f) {
      f = f.trim();
      if (/\s/.test(f) && !(/^['"].*['"]$/.test(f))) f = "'" + f + "'";
      return f;
    }).join(', ');
    return (cs.fontWeight || '400') + ' ' + cs.fontSize + ' ' + fam;
  }

  function fontMetrics(cs) {
    var fs = parseFloat(cs.fontSize) || 16;
    var xh = fs * 0.5, asc = fs * 0.75, desc = fs * 0.25; // fallbacks
    var ctx = probe();
    if (ctx) {
      try {
        ctx.font = fontString(cs);
        var mx = ctx.measureText('x');
        var mh = ctx.measureText('h');
        var mp = ctx.measureText('p');
        if (mx.actualBoundingBoxAscent) xh = mx.actualBoundingBoxAscent;
        if (mh.actualBoundingBoxAscent) asc = mh.actualBoundingBoxAscent;
        if (mp.actualBoundingBoxDescent) desc = mp.actualBoundingBoxDescent;
      } catch (err) { /* keep fallbacks */ }
    }
    return { xh: xh, asc: asc, desc: desc };
  }

  /* Measured baseline offset (px from a line box's top to the text
     baseline) for a given inline element's font style. Probes a single
     ascender-only char 'h' — its bottom IS the baseline. */
  function baselineOffset(real) {
    var cs = getComputedStyle(real);
    var probe = document.createElement('span');
    probe.style.cssText = 'font-family:' + cs.fontFamily +
      ';font-size:' + cs.fontSize + ';font-weight:' + cs.fontWeight +
      ';line-height:' + cs.lineHeight +
      ';position:absolute;left:-99999px;top:0;visibility:hidden;';
    probe.textContent = 'h';
    (real.parentNode || document.body).appendChild(probe);
    var lineRect = probe.getBoundingClientRect();
    var range = document.createRange();
    range.selectNodeContents(probe);
    var hRect = range.getBoundingClientRect();
    probe.remove();
    if (!lineRect.height || !hRect.height) return null;
    return hRect.bottom - lineRect.top;
  }

  /* Measure the REAL text of one ink line: per-character boxes (Range
     geometry — the browser's layout) + baseline offset. */
  function measureLine(line) {
    var real = line.querySelector('.ink-real');
    if (!real) return null;
    var text = line.getAttribute('data-text') || '';
    if (!text) return null;
    var i, c;
    for (i = 0; i < text.length; i++) {
      c = text[i];
      if (c !== ' ' && !A[c]) return null; // unsupported glyph → real text only
    }
    var lineRect = real.getBoundingClientRect();
    if (!lineRect.width || !lineRect.height) return null;

    var cs = getComputedStyle(real);
    var fm = fontMetrics(cs);
    var baseOff = baselineOffset(real);
    if (baseOff === null) baseOff = fm.asc; // degraded probe fallback

    var nodes = [];
    (function walk(n) {
      Array.prototype.forEach.call(n.childNodes, function (ch) {
        if (ch.nodeType === 3) nodes.push(ch);
        else walk(ch);
      });
    })(real);

    var chars = [];
    var idx = 0;
    var range = document.createRange();
    nodes.forEach(function (tn) {
      for (var k = 0; k < tn.data.length; k++) {
        if (idx >= text.length) break;
        range.setStart(tn, k);
        range.setEnd(tn, k + 1);
        var r = range.getBoundingClientRect();
        chars.push({
          ch: text[idx],
          left: r.left - lineRect.left,
          right: r.right - lineRect.left,
          top: r.top - lineRect.top
        });
        idx++;
      }
    });

    if (!chars.some(function (ch2) { return ch2.ch !== ' '; })) return null;

    return {
      W: lineRect.width,
      H: lineRect.height,
      chars: chars,
      xh: fm.xh,
      baseOff: baseOff
    };
  }

  function createNib(svg, big) {
    var rOut = big ? 9 : 4;
    var rIn = big ? 3.2 : 1.6;
    var nib = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nib.setAttribute('class', 'ink-nib');
    nib.style.opacity = 0;
    nib.innerHTML = '<circle r="' + rOut + '" fill="' + INK + '" opacity="0.12"></circle><circle r="' + rIn + '" fill="' + INK + '"></circle>';
    svg.appendChild(nib);
    return nib;
  }

  /* Map a local (design-space) point to svg user space using a glyph's
     transform: rotate(rot) about (gcx,100), then scale(sx,sy), then
     translate(tx,ty). getPointAtLength returns local coords, so the
     nib (a sibling in svg space) must be transformed this way. */
  function applyXf(pt, xf) {
    var dx = pt.x - xf.gcx, dy = pt.y - 100;
    var c = Math.cos(xf.rad), s = Math.sin(xf.rad);
    var rx = dx * c - dy * s + xf.gcx;
    var ry = dx * s + dy * c + 100;
    return { x: rx * xf.sx + xf.tx, y: ry * xf.sy + xf.ty };
  }

  /* Shared stroke-sequence animator. Same easing + per-stroke duration
     curve for the handwriting and the margin sketch.
     flat = [{ q: { el, len, xf? }, nib: <g|null> }] in draw order. */
  function animateSequence(flat, pace, onDone) {
    var i = 0, segStart = null;

    function frame(now) {
      if (i >= flat.length) {
        if (onDone) onDone();
        return;
      }
      var cur = flat[i];
      if (segStart === null) segStart = now;
      var dur = Math.max(70, Math.min(850, cur.q.len * 0.028)) * (pace || 1);
      var k = Math.min(1, (now - segStart) / dur);
      var eased = k * k * (3 - 2 * k);
      cur.q.el.style.strokeDashoffset = cur.q.len * (1 - eased);
      if (cur.nib) {
        var pt = cur.q.el.getPointAtLength(cur.q.len * eased);
        if (cur.q.xf) pt = applyXf(pt, cur.q.xf);
        cur.nib.setAttribute('transform', 'translate(' + pt.x + ' ' + pt.y + ')');
        cur.nib.style.opacity = 1;
      }
      if (k >= 1) {
        i++;
        segStart = null;
        if (i < flat.length) {
          var nx = flat[i];
          if (cur.nib && nx.nib && nx.nib !== cur.nib) {
            // pen lift to a different nib: hide this one, seat the next
            cur.nib.style.opacity = 0;
            var sp = nx.q.el.getPointAtLength(0);
            if (nx.q.xf) sp = applyXf(sp, nx.q.xf);
            nx.nib.setAttribute('transform', 'translate(' + sp.x + ' ' + sp.y + ')');
          }
        } else if (cur.nib) {
          cur.nib.style.opacity = 0;
        }
      }
      requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
  }

  /* Build the overlay SVG for one line: viewBox = the real text box
     (1 unit = 1px), each glyph centered on its real character cell,
     x-height matched to the font. Non-uniform scale so a wide doodle
     glyph fits a narrow cell; non-scaling-stroke keeps pen weight even. */
  function buildLine(line) {
    var svg = line.querySelector('.ink-svg');
    if (!svg) return null;
    var m = measureLine(line);
    if (!m) return null;

    svg.setAttribute('viewBox', '0 0 ' + m.W.toFixed(1) + ' ' + m.H.toFixed(1));
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var sy = m.xh / 36;
    var flat = [];

    m.chars.forEach(function (ch, i) {
      if (ch.ch === ' ' || !A[ch.ch]) return;
      var g = A[ch.ch];
      var j = jitter(i);
      var bb = GB[ch.ch];
      var inkW = Math.max(1, bb.maxX - bb.minX);
      var cellW = Math.max(4, ch.right - ch.left);
      var sx = cellW / (inkW + 6);
      var minSx = sy * 0.5;
      if (sx < minSx) sx = minSx;
      var gcx = (bb.minX + bb.maxX) / 2;
      var cx = (ch.left + ch.right) / 2;
      var tx = cx - sx * gcx;
      var ty = (ch.top + m.baseOff) - sy * 100 + sy * j.dy;
      if (!isFinite(tx) || !isFinite(ty) || !isFinite(sx) || !isFinite(sy)) return; // keep real text for this char
      var xf = {
        sx: sx, sy: sy, tx: tx, ty: ty, gcx: gcx,
        rad: (j.rot * Math.PI) / 180
      };
      var tf = 'translate(' + tx.toFixed(2) + ' ' + ty.toFixed(2) + ') ' +
        'scale(' + sx.toFixed(3) + ' ' + sy.toFixed(3) + ') ' +
        'rotate(' + j.rot + ' ' + gcx.toFixed(1) + ' 100)';
      g.paths.forEach(function (d) {
        var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        el.setAttribute('d', d);
        el.setAttribute('transform', tf);
        el.setAttribute('fill', 'none');
        el.setAttribute('stroke', INK);
        el.setAttribute('stroke-width', '2.6');
        el.setAttribute('vector-effect', 'non-scaling-stroke');
        el.setAttribute('stroke-linecap', 'round');
        el.setAttribute('stroke-linejoin', 'round');
        el.setAttribute('data-g', ch.ch);
        svg.appendChild(el);
        var L = el.getTotalLength();
        el.style.strokeDasharray = L + ' ' + L;
        el.style.strokeDashoffset = L;
        flat.push({ q: { el: el, len: L, xf: xf }, nib: null });
      });
    });

    if (!flat.length) return null;
    var nib = createNib(svg, false);
    flat.forEach(function (f) { f.nib = nib; });
    return flat;
  }

  function drawBlock(block) {
    if (drawing[block]) return;
    var flat = [];
    Array.prototype.forEach.call(block.querySelectorAll('.ink-line'), function (line) {
      var f = buildLine(line);
      if (f) flat = flat.concat(f);
    });
    if (!flat.length) {
      // nothing drawable (or fonts unavailable) — real text stands
      block.classList.add('ink-done');
      return;
    }
    drawing[block] = true;

    var sp0 = flat[0].q.el.getPointAtLength(0);
    flat[0].nib.setAttribute('transform', 'translate(' + sp0.x + ' ' + sp0.y + ')');
    animateSequence(flat, 1, function () {
      drawing[block] = false;
      block.classList.add('ink-done');
      if (pendingRedraw[block]) {
        pendingRedraw[block] = false;
        window.__GM_INK.redraw(block);
      }
    });
  }

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS keeps real text
    var blocks = Array.prototype.slice.call(document.querySelectorAll('.ink-block'));
    if (!blocks.length) return;

    function go() {
      if (!('IntersectionObserver' in window)) {
        blocks.forEach(function (b) {
          b.classList.add('ink-live');
          drawBlock(b);
        });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            if (!e.target.classList.contains('ink-done') && !drawing[e.target]) {
              e.target.classList.add('ink-live');
              drawBlock(e.target);
            }
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.45 });
      blocks.forEach(function (b) { io.observe(b); });
    }

    // Measure real text after webfonts settle (bounded wait).
    if (document.fonts && document.fonts.ready) {
      Promise.race([
        document.fonts.ready,
        new Promise(function (r) { setTimeout(r, 2500); })
      ]).then(go);
    } else {
      go();
    }

    // If the viewport width changes a lot (rotation / resize) after a
    // block finished, re-measure so the overlay matches the new layout.
    var lastW = window.innerWidth;
    var rt = null;
    window.addEventListener('resize', function () {
      var w = window.innerWidth;
      if (Math.abs(w - lastW) < 80) return;
      lastW = w;
      if (rt) clearTimeout(rt);
      rt = setTimeout(function () {
        blocks.forEach(function (b) {
          if (b.classList.contains('ink-done')) window.__GM_INK.redraw(b);
        });
      }, 250);
    }, { passive: true });
  }

  /* Public API. */
  window.__GM_INK = {
    /* Re-ink a block with new text (GOAT easter egg). The real text must
       already be updated by the caller; layout is re-measured fresh. */
    redraw: function (block) {
      if (!block) return;
      if (drawing[block]) {
        pendingRedraw[block] = true;
        return;
      }
      Array.prototype.forEach.call(block.querySelectorAll('.ink-svg'), function (svg) {
        while (svg.firstChild) svg.removeChild(svg.firstChild);
      });
      block.classList.remove('ink-done');
      if (!block.classList.contains('ink-live')) block.classList.add('ink-live');
      drawBlock(block);
    },

    /* Sketch-in an existing inline <svg> of hand-drawn paths (margin
       doodles). Same stroke-reveal system. Reduced motion → drawn. */
    sketch: function (container) {
      if (!container) return;
      var svg = container.querySelector('svg');
      if (!svg || container.__gmSketched) return;
      container.__gmSketched = true;
      var paths = Array.prototype.slice.call(svg.querySelectorAll('path'));
      if (!paths.length) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        paths.forEach(function (p) {
          p.style.strokeDasharray = 'none';
          p.style.strokeDashoffset = '0';
        });
        container.classList.add('sketch-done');
        return;
      }

      var nib = createNib(svg, true);
      var flat = [];
      paths.forEach(function (el) {
        var L = el.getTotalLength();
        el.style.strokeDasharray = L + ' ' + L;
        el.style.strokeDashoffset = L;
        flat.push({ q: { el: el, len: L }, nib: nib });
      });
      var sp0 = flat[0].q.el.getPointAtLength(0);
      nib.setAttribute('transform', 'translate(' + sp0.x + ' ' + sp0.y + ')');
      animateSequence(flat, 0.8, function () {
        container.classList.add('sketch-done');
      });
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
