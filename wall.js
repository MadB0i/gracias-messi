/* wall.js — The Wall of Gracias. GitHub as the CMS: fan notes are
   issues labeled "gracias-note" in this repo. Reading uses the public
   GitHub API (cached in sessionStorage, latest 50). Writing opens a
   prefilled issues/new URL — no server, no database.
   All user-generated text is rendered via textContent (XSS-safe). */
(function () {
  'use strict';

  var API = 'https://api.github.com/repos/MadB0i/gracias-messi/issues?state=open&labels=gracias-note&per_page=50&sort=created&direction=desc';
  var NEW = 'https://github.com/MadB0i/gracias-messi/issues/new?title={t}&body={b}&labels=gracias-note';
  var CACHE = 'gm-wall';
  var CACHE_TTL = 10 * 60 * 1000; // 10 minutes
  var MAX = 50;

  var grid, state, form, input;
  var notes = [];
  var busy = false;

  function i18n(key) {
    if (window.__GM_I18N) {
      var v = window.__GM_I18N.t(key);
      if (v) return v;
    }
    return FALLBACK[key];
  }

  var FALLBACK = {
    loading: 'Loading the wall…',
    empty: 'The wall is waiting for its first note. Yours could be it.',
    error: 'GitHub is rate-limiting right now. The wall will load on your next visit — the notes live in the repo issues.',
    done: 'Your note is on its way — publish the issue and it appears here (and for everyone) on the next load.'
  };

  function setText(el, msg) {
    el.textContent = msg;
  }

  function clearGrid() {
    while (grid.firstChild) grid.removeChild(grid.firstChild);
  }

  function renderState(msg) {
    clearGrid();
    state = document.createElement('p');
    state.className = 'wall__state';
    setText(state, msg);
    grid.appendChild(state);
  }

  function noteCard(n) {
    var card = document.createElement('article');
    card.className = 'wall__note';

    var text = document.createElement('p');
    text.className = 'wall__note-text';
    text.textContent = n.text;
    card.appendChild(text);

    var sig = document.createElement('div');
    sig.className = 'wall__note-sig';

    var av = document.createElement('img');
    av.className = 'wall__note-av';
    av.src = n.avatar;
    av.width = 22;
    av.height = 22;
    av.loading = 'lazy';
    av.referrerPolicy = 'no-referrer';
    av.alt = '';

    var name = document.createElement('span');
    name.className = 'wall__note-name';
    name.textContent = '@' + n.author;

    sig.appendChild(av);
    sig.appendChild(name);
    card.appendChild(sig);

    if (n.url) {
      card.classList.add('wall__note--link');
      card.title = 'View this note on GitHub';
      card.addEventListener('click', function () {
        window.open(n.url, '_blank', 'noopener');
      });
    }
    return card;
  }

  function renderNotes() {
    clearGrid();
    if (!notes.length) {
      renderState(i18n('empty'));
      return;
    }
    notes.forEach(function (n) { grid.appendChild(noteCard(n)); });
    if (notes.length >= MAX) {
      var more = document.createElement('p');
      more.className = 'wall__more';
      more.textContent = '— 50 most recent shown —';
      grid.appendChild(more);
    }
    // the wall grows the page → let scroll progress re-measure
    window.dispatchEvent(new Event('resize'));
  }

  function parse(list) {
    var out = [];
    list.forEach(function (it) {
      if (it.pull_request) return; // issues API can return PRs
      var u = it.user || {};
      var text = (it.title || '').trim();
      if (!text && it.body) {
        text = String(it.body).replace(/\s+/g, ' ').trim();
        if (text.length > 140) text = text.slice(0, 137) + '…';
      }
      if (!text) return;
      out.push({
        author: u.login || 'anon',
        avatar: u.avatar_url || 'https://github.com/ghost.png',
        text: text.length > 140 ? text.slice(0, 137) + '…' : text,
        url: it.html_url || null
      });
    });
    return out.slice(0, MAX);
  }

  function fetchWall() {
    busy = true;
    fetch(API, { headers: { 'Accept': 'application/vnd.github+json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('http ' + res.status);
        return res.json();
      })
      .then(function (list) {
        notes = parse(list);
        try {
          sessionStorage.setItem(CACHE, JSON.stringify({ ts: Date.now(), notes: notes }));
        } catch (err) { /* storage full/blocked */ }
        renderNotes();
      })
      .catch(function () {
        // Rate-limited / offline: fall back to cache, else friendly message.
        var cached = readCache(true);
        if (cached) {
          notes = cached;
          renderNotes();
        } else {
          renderState(i18n('error'));
        }
      })
      .then(function () { busy = false; });
  }

  function readCache(silent) {
    try {
      var raw = sessionStorage.getItem(CACHE);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.notes)) return null;
      if (!silent && Date.now() - (data.ts || 0) > CACHE_TTL) return null;
      return data.notes;
    } catch (err) { return null; }
  }

  function submitNote(e) {
    e.preventDefault();
    var raw = (input.value || '').trim();
    if (!raw) return;
    var title = raw.split('\n')[0].slice(0, 72);
    var body = raw + '\n\n— posted from the Wall of Gracias (gracias-messi)';
    var url = NEW.replace('{t}', encodeURIComponent(title)).replace('{b}', encodeURIComponent(body));
    window.open(url, '_blank', 'noopener');
    input.value = '';
    renderState(i18n('done'));
    if (window.__GM_CONFETTI) window.__GM_CONFETTI();
  }

  function init() {
    grid = document.getElementById('wallGrid');
    form = document.getElementById('wallForm');
    input = document.getElementById('wallNote');
    if (!grid || !form || !input) return;

    renderState(i18n('loading'));
    var cached = readCache(false);
    if (cached && cached.length) {
      notes = cached;
      renderNotes();
    }
    fetchWall();

    form.addEventListener('submit', submitNote);

    document.addEventListener('gm:lang', function () {
      if (!notes.length && !busy) {
        var s = grid.querySelector('.wall__state');
        if (s) {
          var txt = s.textContent;
          var key = txt === FALLBACK.empty ? 'empty' : (txt === FALLBACK.error ? 'error' : 'done');
          setText(s, i18n(key));
        }
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
