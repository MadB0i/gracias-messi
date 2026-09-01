# Contributing

Thanks for your interest in improving this tribute.

## Rules

- **Single-file only** — no build step, no frameworks, no npm. Plain HTML/CSS/JS.
- **Verified data only** — all stats in `messi-career.json` must be sourced and traceable. No rounding, no invention.
- **Keep it small** — the whole page is ~50KB. Don't add heavy libraries.

## How to contribute

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-idea`
3. Make your changes
4. Test in browser (open `messi-tribute.html` directly)
5. Open a PR with a clear description

## What to work on

Check [open issues](https://github.com/MadB0i/gracias-messi/issues) for labeled tasks, or suggest your own.

## Code style

- Use CSS variables from `:root` (see existing palette)
- Keep animations minimal — one deliberate animated moment per section max
- Use semantic HTML with ARIA labels
- Respect `prefers-reduced-motion`

## Reporting bugs

Open an issue with:
- What you expected
- What actually happened
- Browser + device (if relevant)
