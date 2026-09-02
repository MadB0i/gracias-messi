/* ink.js — real pen-stroke reveal.
   A hand-drawn monoline cursive alphabet (19 glyphs) is composed into
   SVG paths; each path is drawn with stroke-dashoffset while a small
   nib follows getPointAtLength. Triggered by IntersectionObserver,
   runs once. prefers-reduced-motion → static Caveat text instead. */
(function () {
  'use strict';

  /* Each glyph: adv = advance width, paths = pen strokes in writing order.
     Local box: baseline y=100, x-height y=64, ascender ~y=28, descender ~y=132. */
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

  function init() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // CSS keeps static fallback
    var blocks = document.querySelectorAll('.ink-block');
    if (!blocks.length) return;

    blocks.forEach(function (b) { b.classList.add('ink-live'); }); // swap fallback → svg

    if (!('IntersectionObserver' in window)) {
      blocks.forEach(drawBlock);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          drawBlock(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.45 });
    blocks.forEach(function (b) { io.observe(b); });
  }

  function jitter(i) {
    return {
      rot: (((i * 37) % 7) - 3) * 0.7,
      dy: (((i * 53) % 5) - 2) * 0.9
    };
  }

  function createNib(svg) {
    var nib = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    nib.setAttribute('class', 'ink-nib');
    nib.style.opacity = 0;
    nib.innerHTML = '<circle r="9" fill="' + INK + '" opacity="0.12"></circle><circle r="3.2" fill="' + INK + '"></circle>';
    svg.appendChild(nib);
    return nib;
  }

  /* Shared stroke-sequence animator. Used by the handwriting (one nib
     per line) and the margin sketch (one shared nib). Same easing,
     same per-stroke duration curve; pace is a multiplier.
     flat = [{ q: { el, len }, nib: <g|null> }] in draw order. */
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

  function buildLine(svg, text) {
    var x = 4, idx = 0;
    var strokes = [];
    for (var c = 0; c < text.length; c++) {
      var g = A[text[c]];
      if (!g) continue;
      var j = jitter(idx);
      var tf = 'translate(' + x + ' ' + j.dy + ') rotate(' + j.rot + ' ' + (x + 30) + ' 100)';
      g.paths.forEach(function (d) { strokes.push({ d: d, tf: tf }); });
      x += g.adv;
      idx++;
    }
    svg.setAttribute('viewBox', '0 0 ' + (x + 16) + ' 150');
    var queue = strokes.map(function (s) {
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', s.d);
      el.setAttribute('transform', s.tf);
      el.setAttribute('fill', 'none');
      el.setAttribute('stroke', INK);
      el.setAttribute('stroke-width', '5.5');
      el.setAttribute('stroke-linecap', 'round');
      el.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(el);
      var L = el.getTotalLength();
      el.style.strokeDasharray = L + ' ' + L;
      el.style.strokeDashoffset = L;
      return { el: el, len: L };
    });
    var nib = createNib(svg);
    return { queue: queue, nib: nib };
  }

  function drawBlock(block) {
    if (drawing[block]) return;
    var parts = Array.prototype.map.call(block.querySelectorAll('.ink-line'), function (line) {
      var svg = line.querySelector('.ink-svg');
      return buildLine(svg, line.getAttribute('data-text') || '');
    });

    var flat = [];
    parts.forEach(function (p) {
      p.queue.forEach(function (q) { flat.push({ q: q, nib: p.nib }); });
    });
    if (!flat.length) return;
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

  /* Public API — lets the GOAT easter egg (ui.js) re-ink a block with
     new text without waiting for scroll. Clears existing strokes + nib
     first, then redraws from scratch. If a draw is already in flight,
     the redraw is queued and runs when it finishes. */
  window.__GM_INK = {
    redraw: function (block) {
      if (!block) return;
      if (drawing[block]) {
        pendingRedraw[block] = true;
        return;
      }
      var svgs = block.querySelectorAll('.ink-svg');
      for (var s = 0; s < svgs.length; s++) svgs[s].innerHTML = '';
      block.classList.remove('ink-done');
      drawBlock(block);
    },

    /* Sketch-in an existing inline <svg> of hand-drawn paths (margin
       doodles). Reuses the same stroke-reveal system: dash offset per
       path, one shared nib, same easing. Reduced motion → fully drawn. */
    sketch: function (container) {
      if (!container) return;
      var svg = container.querySelector('svg');
      if (!svg || container.__gmSketched) return;
      container.__gmSketched = true;
      var paths = Array.prototype.slice.call(svg.querySelectorAll('path'));
      if (!paths.length) return;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        // static fully-drawn fallback
        paths.forEach(function (p) {
          p.style.strokeDasharray = 'none';
          p.style.strokeDashoffset = '0';
        });
        container.classList.add('sketch-done');
        return;
      }

      var nib = createNib(svg);
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
