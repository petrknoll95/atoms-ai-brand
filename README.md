# AtomsAI Brand

Interactive brand guidelines and asset library for AtomsAI, built with [Astro](https://astro.build).
It mirrors the **Brand Guidelines (WIP)** page of the `AtomsAI-Brand` Figma file and adds tools to copy colors, download logos, icons and illustrations, and generate patterns.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site in dist/
npm run check    # type check
```

## What's in it

| Section | Interactive |
| --- | --- |
| Intro | Cover with the mark reveal; contents |
| Logo | Mark and logotype in Black, Deep green, Cream and White: Copy SVG, SVG, PNG (transparent, 2400 px). App icon in its official colorway. Rule diagrams and a replayable mark reveal |
| Color | Click any color to copy its hex; copy RGB, CMYK or the CSS variable; copy gradient CSS; theme contrast ratios calculated live |
| Typography | Editable specimens for every face, character set, scale and headline rule |
| Icons | 15 stroke icons with a shared color and Regular/Medium weight switch; Copy SVG, SVG, PNG (512 px) |
| Patterns | Live renders of every structure, density and colorway, plus a generator (structure, colorway, density, size, rotation, scale, position, PNG export, shareable link) |
| Illustration | Concept drawings and linework, recolorable, as SVG or PNG |
| Examples | Application mockups |

The UI chrome uses two type sizes (display 32 px Founders Grotesk, annotation 14 px PP Neue Montreal) and two text colors (`--fg` Deep green, `--muted` Graphite) on white.

## Structure

```
public/fonts/            Founders Grotesk + PP Neue Montreal (Regular, Medium) as woff2
public/pattern-masks/    Concentric ring masks (Figma's own SVG output, minified)
src/data/colors.ts       The palette — single source for /tokens.css and every swatch
src/data/patterns.ts     Pattern spec: slit gradients, ring masks, colorways
src/data/*.ts            Navigation, logos, icons, asset color options
src/assets/brand/        Logo masters, icons, illustrations, icon diagram strokes, examples
src/scripts/             Copy/download actions, SVG→PNG export, pattern renderer
src/components/          Shell, swatches, asset cards, pattern tiles and generator
src/pages/               One page per section; tokens.css.ts serves the CSS variables
scripts/figma/           Helpers used to clean Figma exports (see below)
```

Colors are available as CSS custom properties at `/tokens.css` (`--deep-green`, `--cream`, …), generated from `src/data/colors.ts`.

## Figma sources

File `71GQknySbCroHLUwJYdAn2` (AtomsAI-Brand), page **Brand Guidelines (WIP)**, frame `1157:10196`.

| Asset | Figma node |
| --- | --- |
| Mark master | `743:816` (Logo / Mark) |
| Logotype lockup | `1289:21547` (component "Logo", lowercase atomsAI) — Symbol + Wordmark |
| Color variables | collection "Brand colors" |
| Pattern templates | Drift A `1032:17487–17490`, Offset B `1032:17491–17494`, Single band C `1032:17495–17498` (in "Frame 187"), Concentric `1042:12649`, `1042:12742` |
| Pattern colorways | slides 4.2–4.6 (`1157:11788`, `1157:11807`, `1157:11826`, `1157:11845`, `1274:10177`) |
| Icons | 6.3 Library `1262:7807` (72 px artwork, normalized to 24 px) |
| Illustrations | 7.1 Style `1157:14267`, 7.2 Linework `1157:14345` |
| Diagrams | Logo slides 2.1–2.11 are redrawn in HTML from the master artwork (`src/components/`); Iconography 6.1–6.2 keep their icon strokes as SVG over an HTML grid |
| Examples | Applications 8.1–8.9 `Mockups` frames |

### Re-syncing assets

Assets were exported through the Figma MCP server and cleaned with the scripts in `scripts/figma/`:

- `compose_logos.py` builds `logotype.svg` (and optionally `mark.svg`) with `currentColor` from the clean Symbol/Wordmark exports of the "Logo" component (`--wordmark-at 280 0`). The lockup geometry (kerning, x-height, gap) used by the diagrams lives in `src/data/logos.ts`.
- `extract.py` cuts a single layer out of a node's SVG export, keeps only the defs it references, maps colors (e.g. `white=currentColor`) and namespaces ids so diagrams can be inlined together.
- `icons.py` normalizes the 72 px icon exports to a 24 px grid with `stroke="currentColor"`.
- `minify_rings.py` turns the Concentric mask exports into the files in `public/pattern-masks/`.

The renderer in `src/scripts/pattern-renderer.ts` reproduces the Figma pattern components. Slit structures are drawn from the exact gradient transforms in `src/data/patterns.ts`, and Concentric tints Figma's own ring masks. Compared against Figma's renders of all 14 greyscale templates, every one matches within a mean difference of 5/255 (most under 2/255).

## Fonts

Founders Grotesk (Klim Type Foundry) and PP Neue Montreal (Pangram Pangram) are commercial typefaces. Self-hosting them on a public site requires web licenses from both foundries. Keep this repository and any deployment private until those licenses are confirmed.
