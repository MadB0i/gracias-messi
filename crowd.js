/* crowd.js — ambient stadium-crowd swell, fully SYNTHESIZED with the
   Web Audio API (looped white noise → lowpass + bandpass, plus two
   slow LFOs for "breathing"). No samples, no recorded/broadcast audio.
   Off by default; one click enables it (which also satisfies browser
   autoplay rules). Master gain swells as the visitor scrolls past
   trophy / milestone moments. Always-visible toggle in the topbar. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BASE = 0.04, PEAK = 0.16;

  var btn = null;
  var ctx = null, master = null;
  var on = false;
  var points = [];
  var ticking = false;

  function buildAudio() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try {
      ctx = new AC();
    } catch (err) { return false; }

    // 2 s of white noise, looped
    var len = ctx.sampleRate * 2;
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;

    var noise = ctx.createBufferSource();
    noise.buffer = buf;
    noise.loop = true;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 480;
    lp.Q.value = 0.6;

    var bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1400;
    bp.Q.value = 0.8;

    var bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.75;
    var shineGain = ctx.createGain();
    shineGain.gain.value = 0.22;

    master = ctx.createGain();
    master.gain.value = 0;

    var comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -24;
    comp.knee.value = 18;
    comp.ratio.value = 6;
    comp.attack.value = 0.4;
    comp.release.value = 0.6;

    noise.connect(lp);
    lp.connect(bodyGain);
    bodyGain.connect(master);
    noise.connect(bp);
    bp.connect(shineGain);
    shineGain.connect(master);
    master.connect(comp);
    comp.connect(ctx.destination);

    // slow amplitude modulation — two incommensurate LFOs for an
    // organic "the crowd breathes" swell
    var lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.07;
    var lfo1g = ctx.createGain();
    lfo1g.gain.value = 0.018;
    var lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.19;
    var lfo2g = ctx.createGain();
    lfo2g.gain.value = 0.01;
    lfo1.connect(lfo1g);
    lfo2.connect(lfo2g);
    lfo1g.connect(master.gain);
    lfo2g.connect(master.gain);

    noise.start();
    lfo1.start();
    lfo2.start();
    return true;
  }

  function measurePoints() {
    points = [];
    var tr = document.getElementById('trophies');
    if (tr) points.push(tr.getBoundingClientRect().top + window.scrollY);
    var ms = document.querySelectorAll('.timeline__item--milestone');
    Array.prototype.forEach.call(ms, function (el2) {
      points.push(el2.getBoundingClientRect().top + window.scrollY);
    });
  }

  function level() {
    var y = window.scrollY + window.innerHeight * 0.5;
    var max = 0;
    for (var i = 0; i < points.length; i++) {
      var dist = Math.abs(y - (points[i] + 60));
      var prox = Math.max(0, 1 - dist / 420);
      if (prox > max) max = prox;
    }
    return max;
  }

  function swell() {
    if (!ctx || !master || !on) return;
    var target = BASE + (PEAK - BASE) * level();
    master.gain.setTargetAtTime(target, ctx.currentTime, 0.45);
  }

  function onScroll() {
    if (!on) return;
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      swell();
    });
  }

  function setOn(v) {
    if (on === v) return;
    on = v;
    if (btn) {
      btn.setAttribute('aria-pressed', v ? 'true' : 'false');
      btn.classList.toggle('is-on', v);
      btn.setAttribute('aria-label', v ? 'Crowd ambience on — click to mute' : 'Crowd ambience off — click to enable');
    }
    if (v) {
      if (!ctx) {
        if (!buildAudio()) {
          // no Web Audio at all: keep the button, just never play
          on = false;
          if (btn) {
            btn.setAttribute('aria-pressed', 'false');
            btn.classList.remove('is-on');
          }
          return;
        }
      }
      measurePoints();
      if (ctx.state === 'suspended') {
        ctx.resume().then(swell).catch(function () { /* ignore */ });
      } else {
        swell();
      }
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.3);
      setTimeout(function () {
        if (!on && ctx) ctx.suspend();
      }, 900);
    }
  }

  function init() {
    btn = document.getElementById('crowdToggle');
    if (!btn) return;
    btn.addEventListener('click', function () { setOn(!on); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', measurePoints, { passive: true });
    window.addEventListener('load', measurePoints);
    measurePoints();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
