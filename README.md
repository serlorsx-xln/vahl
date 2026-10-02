# VAHL

A scroll-driven, interactive website for VAHL, a fictional independent watchmaker in Tromsø, built with Next.js 16, React 19, React Three Fiber, GSAP/ScrollTrigger and Lenis. A procedurally modelled watch movement, the Kaliber 01, comes apart under a loupe and goes back together as you scroll, and the page ends at an allocation request form. It is a design study: the brand, the watch and the movement are invented, nothing is for sale and no request is sent.

## Why it exists

The brief was an award-level scroll experience that avoids the usual landing-page kit (cards, pills, glassmorphism, gradients, bento grids, "trusted by" rows, generic fades). The answer is one concept, **Under the Loupe**: the whole page is a single watch on a watchmaker's bench, told in scenes instead of sections, with typography composed into each frame and a camera that starts slowly and settles long. Every word, part name and number on the page belongs to the invented brand (VAHL / Mørketid / Kaliber 01 / Marit Vahl / 24 watches a year, requests close 27 November), and the page says so in its footer.

```
scroll ──> Lenis (smooth, native under reduced motion)
             │
             ▼
   ScrollTrigger range per scene ──> story.progress[scene]
             │                                │
             ▼                                ▼
   director (GSAP ticker)               R3F Stage (one canvas)
   CSS vars, .on word windows,          camera rig, explode / reassemble,
   ground / temper / ink theme,         lights, specimen tags, power path,
   counters, Tromsø clock and sun       loupe pass around the cursor
             │                                │
             └───────────────┬────────────────┘
                             ▼
   one fixed .stage: ground · lamp · temper · back words · WebGL · front words
```

## Features

Read from the code, accurate as of the current `main`.

- **One watch, seven scenes**. Each scene owns one camera move (`src/components/three/Rig.tsx`) and one set of words (`src/lib/copy.ts`); line breaks in the display type are set by hand.
- **Procedural movement**. The Kaliber 01 (`layout.ts`, `Movement.tsx`, `geometry.ts`) is built in millimetres from bearing positions: bridges are drawn as hulls around their jewels, with the train wheels, balance, remontoir, blued screws and rubies in gold chatons. The counts in the copy (214 parts, 38 screws, 31 jewels) are the fictional spec; the model carries a representative set. It is plausible, not engineered.
- **Watchmaking finishes as materials** (`materials.ts`): frosted German silver, perlage, hand-bevelled anglage, sunburst ratchet, black polish with its own dark reflection room, heat-blued steel with a little thin-film shift, rubies. Every texture is generated in code; nothing is downloaded.
- **Exploded-drawing labels** (`Labels.tsx`): tags with hairline leaders, laid out in one column beside the stack with no overlaps, plus a compact mode for short viewports.
- **Power path** (`PowerPath.tsx`): a ruby line from barrel to balance once the last part is off, with a bead that steps one wheel along it per second.
- **The loupe** (`Pipeline.tsx`): on desktop with a mouse, the cursor becomes a lens over the work (off during the remontoir and night scenes). The scene is rendered a second time through an offset camera, so it shows real extra detail rather than an upscaled copy.
- **Temper run**: in the remontoir scene a field of heat-blued steel spreads out from the remontoir the way colour runs across tempered steel, with straw, bronze and purple at the front. Fixed chrome inks itself piece by piece as the front passes it.
- **Live details**: the top bar shows the Tromsø clock, the night scene shows the sun's real elevation over Tromsø, the request scene counts down to 27 November, and a counter totals the remontoir's releases since the page opened.
- **Minute track**: a 60-tick progress rail down the left edge that doubles as chapter navigation.
- **Request form** (`Request.tsx`): name, email, country and a note, with inline validation, `aria-invalid`/`aria-describedby`, focus management and sending/received/edit states. It is a demo; see Security notes.
- **Distinct mobile composition**: its own camera keys and paths, and a single caption for the part that just came off instead of the tag column; past the request's top, the watch rides up with the page.
- **Top bar** tucks away while reading down the request and returns on scroll up or keyboard focus.
- **Reduced motion**: Lenis is off, each scene rests on curated still frames (`REST` in `src/lib/story.ts`), words appear by opacity only and nothing travels.
- **Accessibility and fallbacks**: the stage is `aria-hidden`, with the same story as linear text for screen readers and no-JS (`SrCopy`); a skip link goes straight to the request; without WebGL the page keeps its words and drops the tags and loupe (`gl-failed`).

### Scenes

| Scene id | Name | Length | What happens |
|---|---|---|---|
| `tick` | The step | 130vh | The watch as worn; the dead-beat seconds hand holds, then moves once a second |
| `turn` | Kaliber 01 | 170vh | The case turns over to show the movement and its engraved train bridge |
| `apart` | 214 parts | 420vh | Screws, balance, bridges, escapement and train come off with captions; the power path draws last |
| `once` | Remontoir | 320vh | The constant-force spring isolated on a field of heat-blued steel; the release counter runs |
| `again` | Twice | 240vh | The movement goes back together (every Kaliber 01 is assembled twice) |
| `night` | Mørketid | 260vh | The room goes down to one warm lamp; the word is the horizon and the watch sinks behind it |
| `request` | Request | page | Allocation request form, closing countdown, specs and the fiction note in the footer |

## Requirements

- Node.js 20.9 or newer (required by Next.js 16; developed on Node 24)
- npm (uses `package-lock.json`)
- A browser with WebGL for the full experience

## Usage

Local development:

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build and serve:

```bash
npm run build      # Next.js 16 (Turbopack); the page prerenders as static content
npm start
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check (`next build` does not lint, so run both) |

`next.config.ts` allows one ngrok host as a dev origin for tunnel access.

### Tests

There is no automated test suite in this repository. The build was checked with type checks, ESLint, the Impeccable design detector, and scripted headless-Chrome passes covering layout collisions and overflow, watch coverage per frame, contrast and form behaviour. Those scripts are not committed.

## Deploy

No Dockerfile or `coolify.yaml` is included yet. The app needs no environment variables or backend, so any Node host works with `npm run build && npm start` (port 3000 by default), as does any platform that runs Next.js apps natively.

## Security notes

- **No backend, no secrets.** There are no API routes, environment variables or keys.
- **The form sends nothing.** Submitting validates the fields, shows a timed "Sealing" state, then a received message. There is no `fetch`, storage or analytics anywhere in `src`, and the form itself says "Nothing you type leaves this page."
- **No runtime third-party requests.** Archivo comes from `next/font/google`, which downloads it at build time and serves it from the app; all textures are generated in the browser.
- **Fiction is disclosed.** VAHL, the Mørketid and the Kaliber 01 are invented; the footer says there is no watch for sale and no request is sent. Any resemblance to a real watchmaker is unintended.
- `next.config.ts` sets no extra security headers.

## Project structure

```
src/app/               layout (Archivo via next/font), page, globals.css, icon.svg
src/components/        Experience (boot: Lenis, director, stage), Scenes, Chrome
                       (bar, minute track, cursor, loupe readout, tags), Request (form, footer)
src/components/three/  R3F stage: Watch, Movement, Rig (camera), Lights, Labels,
                       PowerPath, Pipeline (loupe pass), materials, geometry, layout
src/lib/               story (scenes, progress, reduced-motion frames), director (per-frame
                       DOM and theme), copy, time (Tromsø clock, sun, countdown), scroll, math
PRODUCT.md             product brief: users, purpose, tone, anti-references
DESIGN.md              the design system as built (colours, type, motion, named rules)
.impeccable/           design.json (DESIGN.md sidecar) and the surface brief
```

## License

No license file is present in this repository; the package is marked `private`. All rights reserved by the repository owner unless stated otherwise.
