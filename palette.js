/* palette.js — command palette for the dev crowd.
   "/" or Cmd/Ctrl+K to open. Fuzzy-searches every [data-cmd] element
   (stats, trophies, timeline, sections) and scrolls to it.
   Fixed-position overlay → zero layout shift. No dependencies. */
(function () {
  'use strict';

  var root, input, list, idx = 0, items = [], sel = -1;

  function build() {
    root = document.createElement('div');
    root.className = 'cmdk';
    root.hidden = true;
    root.innerHTML =
      '<div class="cmdk-backdrop"></div>' +
      '<div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="Search this tribute">' +
      '<input class="cmdk-input" type="text" placeholder="Search stats, trophies, milestones…" autocomplete="off" spellcheck="false">' +
      '<ul class="cmdk-list"></ul>' +
      '<div class="cmdk-foot"><span>↑↓</span> navigate <span>↵</span> jump <span>esc</span> close</div>' +
      '</div>';
    document.body.appendChild(root);
    input = root.querySelector('.cmdk-input');
    list = root.querySelector('.cmdk-list');
    root.querySelector('.cmdk-backdrop').addEventListener('click', close);
    input.addEventListener('input', render);
    input.addEventListener('keydown', onKey);
  }

  function index() {
    items = [];
    document.querySelectorAll('[data-cmd]').forEach(function (el) {
      items.push({
        label: el.getAttribute('data-cmd'),
        sub: el.getAttribute('data-cmd-sub') || '',
        el: el
      });
    });
  }

  function score(label, q) {
    label = label.toLowerCase();
    var i = 0, s = 0, streak = 0;
    for (var c = 0; c < label.length && i < q.length; c++) {
      if (label[c] === q[i]) { streak++; s += 2 + streak; i++; }
      else streak = 0;
    }
    return i === q.length ? s : -1;
  }

  function render() {
    var q = input.value.trim().toLowerCase();
    var hits = q
      ? items.map(function (it) { return { it: it, s: score(it.label, q) }; })
          .filter(function (x) { return x.s >= 0; })
          .sort(function (a, b) { return b.s - a.s; })
          .slice(0, 12).map(function (x) { return x.it; })
      : items.slice(0, 12);
    sel = 0;
    list.innerHTML = hits.length
      ? hits.map(function (it, i) {
          return '<li class="cmdk-item' + (i === 0 ? ' sel' : '') + '" data-i="' + i + '">' +
            '<span class="cmdk-l">' + it.label + '</span>' +
            (it.sub ? '<span class="cmdk-s">' + it.sub + '</span>' : '') +
            '</li>';
        }).join('')
      : '<li class="cmdk-empty">nothing found</li>';
    root._hits = hits;
  }

  function go(n) {
    var hit = root._hits[n];
    if (!hit) return;
    close();
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hit.el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'center' });
    hit.el.classList.remove('cmd-flash');
    void hit.el.offsetWidth;
    hit.el.classList.add('cmd-flash');
    setTimeout(function () { hit.el.classList.remove('cmd-flash'); }, 1400);
  }

  function onKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(sel + 1, (root._hits || []).length - 1); paint(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(sel - 1, 0); paint(); }
    else if (e.key === 'Enter') { e.preventDefault(); go(sel); }
    else if (e.key === 'Escape') close();
  }

  function paint() {
    Array.prototype.forEach.call(list.children, function (li, i) {
      li.classList.toggle('sel', i === sel);
    });
    var s = list.children[sel];
    if (s) s.scrollIntoView({ block: 'nearest' });
  }

  function open() {
    if (root.hidden) {
      if (!root._built) { index(); root._built = true; }
      root.hidden = false;
      root.classList.add('on');
      input.value = '';
      render();
      setTimeout(function () { input.focus(); }, 0);
    }
  }
  function close() {
    if (!root.hidden) {
      root.classList.remove('on');
      root.hidden = true;
    }
  }

  document.addEventListener('keydown', function (e) {
    var tag = (document.activeElement && document.activeElement.tagName) || '';
    var typing = tag === 'INPUT' || tag === 'TEXTAREA' || (document.activeElement && document.activeElement.isContentEditable);
    if ((e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) ||
        ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) {
      e.preventDefault();
      root.hidden ? open() : close();
    }
  });

  function init() { build(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
