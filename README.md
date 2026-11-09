# ShellCheck — demo

Compliance console that catches shell businesses receiving Pix for illegal online betting:
it scores business accounts on how badly their money pattern mismatches their declared
activity, links co-registered businesses through the public CNPJ registry, and drafts a
COAF suspicious-activity report that a human analyst must approve.

**Everything is synthetic.** The data is generated from a fixed seed (`SEED = 20261114`),
so every run is identical. There's no backend and no API keys, and it works fully offline (fonts are bundled).
Individual payers are masked and never scored; only business accounts are.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
```

Production build / local preview:

```bash
npm run build
npm run preview    # http://localhost:4173
```

## Deploy (Vercel, static)

```bash
npx vercel --prod
```

`vercel.json` sets `npm run build` → `dist/`. Or import the repo in the Vercel dashboard
(framework preset: Vite). No environment variables are needed.

## Presenter controls

| Key | Action |
| --- | --- |
| `Space` | Play / pause the simulation (clock, feed and all animation freeze) |
| `→` | Next scripted step. In step 5: skip the report stream, then approve & file |
| `←` | Previous step |
| `1`–`5` | Jump to a step (prior steps render in their completed state) |
| `R` | Full reset to step 1 |
| `Esc` | Back to the watchlist (steps 1–2) |

The step bar in the footer is also clickable.

## The 60-second script

1. **Baseline monitoring.** It's 15:41 on Sat 14 Nov 2026. The feed trickles at about 1.5 Pix/s and all 16 businesses are grey.
2. **Kick-off surge.** The clock jumps to 15:59:57 and counts down to kick-off. The feed surges to about 7 Pix/s, and
   *Espaço Místico Lua Cheia – Tarô e Oráculo* swells and turns amber.
3. **Behavioural scoring.** The case opens and four red flags land one by one. The gauge builds to **94**.
4. **Registry linkage.** A shared phone and a shared address appear, and edges snap in from seven businesses.
   Each linked business turns red, and the phone hub pulses. Readout: **7 businesses · 1 phone · 1 address · R$ 2.3M in 30 days**.
5. **COAF report.** The report streams in. *Analyst decision required* appears, then **Approve & file** → case `SC-2026-0412`.

## How it's built

- `src/data/model.ts`: the 16 businesses, network aggregates, and the seeded Pix-per-minute series.
  The ring's 30-day inflows sum to R$ 2,319,250, and every on-screen total is derived from them.
- `src/data/feed.ts`: the deterministic Pix event stream (15:00–18:00) that drives the feed, the live rate and the
  "Pix monitored today" counter.
- `src/data/layout.ts`: two d3-force layouts computed once at load: calm (A) and unmasked (B).
- `src/sim/`: a tiny store plus a requestAnimationFrame loop. All visuals are pure functions of `(step, elapsed)`,
  so pause, jump and reset are exact.
- `src/components/`: top bar, Pix feed, network graph (SVG), case panel, report drawer.

Stack: Vite, React 18, TypeScript, Tailwind 3, d3-force, Framer Motion. There are no component libraries.
