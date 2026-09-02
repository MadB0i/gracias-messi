# LAUNCH.md — v1.0.0 launch kit (copy-paste ready)

> **Source of truth:** the URLs and system list below are pulled from
> [CHANGELOG.md](CHANGELOG.md) / [RELEASE_NOTES.md](RELEASE_NOTES.md) for
> release **v1.0.0**. If the release changes, regenerate from those two files
> so this kit can't drift.
>
> **Release:** https://github.com/MadB0i/gracias-messi/releases/tag/v1.0.0
> **Live demo:** https://madb0i.github.io/gracias-messi/
> **SOURCES.md (fact-checking):** https://github.com/MadB0i/gracias-messi/blob/main/SOURCES.md
>
> **Systems shipped in v1.0.0** (from RELEASE_NOTES.md): Wall of Gracias ·
> Where Were You · Generate my recap · Page-turn bio · Crowd ambience ·
> EN / ES / HI — plus the self-drawing "Gracias, Argentina", the sketched-in
> doodle of the 10, stat counters, 22-season chart + heatmap, shareable PNG
> cards, 3D gallery, `/` command palette, and a GOAT easter egg.
>
> **Attachment for the first X tweet:** `assets/recap-demo.gif` (repo).

---

## 1. Show HN

**Title:**

```
Show HN: Gracias-Messi – a fan tribute where the guestbook is GitHub Issues (no backend)
```

**Body** (~80 words, points at the release):

```
Built this tribute for Messi's final international chapter (he retired Aug 31).
Two things with zero backend: the "Wall of Gracias" is a guestbook where every
note is literally a GitHub issue in the repo, read back through the public API —
the repo is the CMS. And "Generate my recap" draws a 15-second vertical video
on a canvas and records it with MediaRecorder, entirely client-side. No
frameworks, no build step, no server — vanilla HTML/CSS/JS. Every stat and
quote is fact-checked (SOURCES.md).

v1.0.0: https://github.com/MadB0i/gracias-messi/releases/tag/v1.0.0
```

_Best time: Tuesday–Thursday, US morning / EU afternoon (HN front-page
traffic skews that way). Avoid US holidays._

---

## 2. r/webdev

**Title:**

```
A fan tribute site with zero backend: the guestbook is GitHub Issues, the video export is 100% in-browser
```

**Body:**

```
I built a single-page tribute to Messi's final international chapter
(https://madb0i.github.io/gracias-messi/), and the part I'm proudest of is
that there is no backend at all:

- Wall of Gracias — a public guestbook where each note is a GitHub issue
  (labelled gracias-note) in the repo. The public GitHub API is the whole
  "database"; results are cached in sessionStorage, latest 50.
- Generate my recap — a 15-second vertical video drawn on a 1080x1920 canvas
  and recorded with canvas.captureStream() + MediaRecorder. The .webm is
  generated and downloaded entirely in the visitor's browser.
- Crowd ambience — opt-in stadium sound, synthesized with the Web Audio API
  (filtered noise + slow LFOs). No audio samples anywhere.
- The handwriting is a hand-built cursive alphabet rendered as SVG paths,
  revealed per-stroke and laid out against the browser's real text metrics.

No frameworks, no build step, no database — one HTML file plus small
dependency-free JS modules. Full feature list in the v1.0.0 release:
https://github.com/MadB0i/gracias-messi/releases/tag/v1.0.0
```

_Best time: weekday evenings (US) or midday EU tends to outperform weekend
mornings on this sub._

---

## 3. r/soccer / r/football

**Title:**

```
I built a website for Messi's final international chapter — you can type your birth year and see your age at every milestone
```

**Body:**

```
Messi hung up the Argentina shirt on August 31, so I made him a page:
https://madb0i.github.io/gracias-messi/

It walks through the whole international career (927 goals, 47 trophies,
8 Ballons d'Or — every number fact-checked), and the part I love is "Where
Were You": type the year you were born and the timeline rewrites itself, so
under each moment it says "you were 12"… or "not born yet".

You can also leave your own note on the Wall of Gracias, flip through the
story like notebook pages, and switch the page to English, Spanish or Hindi.
It ends with the page writing "Gracias, Argentina" by hand.

Made for the fans — no app, no login, just open it on your phone.
```

_Best time: weekends and matchdays (fans are around); don't post into a live
World Cup final — the feed is taken._

---

## 4. Twitter / X thread (4 tweets)

**Tweet 1** — attach `assets/recap-demo.gif`:

```
Messi retired from Argentina on Aug 31. I built a tribute page — and made it draw its own 15-second recap video, entirely in your browser (no server involved).

No frameworks. No backend. Notebook paper, ink, and one HTML file.
```

**Tweet 2:**

```
There's a wall where fans leave notes.

No server, no database — every single note is literally a GitHub issue in the repo. The repository IS the guestbook.
```

**Tweet 3:**

```
The 5-chapter story doesn't scroll. It flips — like the pages of the notebook he wrote his last note in.

Swipe, scroll, or arrow keys.
```

**Tweet 4:**

```
One tap: English / Español / हिन्दी. The prose translates, the numbers stay.

v1.0.0 is out —
Release: https://github.com/MadB0i/gracias-messi/releases/tag/v1.0.0
Live: https://madb0i.github.io/gracias-messi/
```

_Best time: weekday morning commute (US/EU); avoid matchday afternoons when
the timeline is flooded with highlights._

---

## 5. Reply template — "is this AI-generated garbage?"

Use this verbatim (it's honest and pre-emptive):

```
Fair question — I'll be straight: yes, an AI assistant helped me write the code.
The part I took responsibility for is the facts: every number and quote on the
page is verified against public records and itemized in SOURCES.md, which also
documents how each attribution was checked. If you name a stat you doubt, I'll
point you to its source line.
```

---

## 6. Quick links

- Release (v1.0.0): https://github.com/MadB0i/gracias-messi/releases/tag/v1.0.0
- Live demo: https://madb0i.github.io/gracias-messi/
- SOURCES.md: https://github.com/MadB0i/gracias-messi/blob/main/SOURCES.md
- Demo GIF (attach to tweets): `assets/recap-demo.gif`
- Demo video (full res, 0.5MB): `assets/recap-demo.mp4`
- Static OG card (used by social unfurls): `preview.png`
