# AtomsAI Brand

Interactive brand guidelines and asset library for AtomsAI, built with [Astro](https://astro.build).
It mirrors the **Brand Guidelines (WIP)** page of the `AtomsAI-Brand` Figma file and adds tools to copy colors, download logos, icons and illustrations, and generate patterns.

```bash
npm install
npm run dev      # http://localhost:4321/atoms-ai-brand/
npm run build    # static site in dist/
npm run check    # type check
```

## Deploy

Every push to `main` publishes the site to GitHub Pages at
https://petrknoll95.github.io/atoms-ai-brand/ through `.github/workflows/deploy.yml`.
One-time setup: repo Settings → Pages → Source: GitHub Actions.

The site is served from `/atoms-ai-brand/` (`base` in `astro.config.mjs`), so internal links and
public assets go through `withBase()` in `src/data/base.ts`. On a custom domain, set `site` to it
and `base` to `'/'`.

## What's in it

| Section | Interactive |
| --- | --- |
| Intro | Cover with the mark reveal; contents |
| Logo | Mark and logotype in Black, Deep green, Cream and White: Copy SVG, SVG, PNG (transparent, 2400 px). App icon in its official colorway. Rule diagrams |
| Color | Click any color to copy its hex; copy RGB, CMYK or the CSS variable; copy gradient CSS; theme contrast ratios calculated live |
| Typography | Editable specimens for every face, character set, scale and headline rule |
| Icons | 15 stroke icons with a shared color and Regular/Medium weight switch; Copy SVG, SVG, PNG (512 px) |
| Patterns | Live renders of every structure, density and colorway, and live usage tiles |
| Illustration | Concept drawings and linework, recolorable, as SVG or PNG |
| Examples | Application mockups |
| Tools | `/tools/`: the pattern generator, with a Tweakpane panel (structure, colorway, density, size, rotation, scale, position, PNG export, shareable link), and the looping mark reveal with four colorways, an export frame, logo size and video export (MP4 or WebM, four aspect ratios, 720p to 4K) |
| Assets | `/assets/`: downloadable files by category, each with a preview and a download, and a "Download all" zip built per category at build time (`src/pages/assets/[category].zip.ts`). Fonts for now; add categories in `src/data/downloads.ts` |
| Skills | `/skills/`: two portable agent skills, with formatted and source previews, clipboard copy, individual Markdown downloads and a ZIP with standard skill folders |

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

## Agent skills

`skills/atomsai-brand/SKILL.md` covers the full brand system; `skills/atomsai-icons/SKILL.md` covers the icon style, measured master geometry and SVG production. Both are self-contained Markdown with portable `name` and `description` frontmatter. They can be installed in a host's skills directory or used as ordinary instructions/attachments. No vendor-specific tools are required.

The Skills page, clipboard payload, `/skills/<name>/SKILL.md` endpoints and `/skills/atomsai-skills.zip` all use these same source files. Source files contain the current production links; generated previews/downloads automatically rewrite that origin and base from Astro's `site`/`base` settings. Add new skills to `src/data/skills.ts` and the Skills subsection list in `src/data/nav.ts`.

Agents can fetch artwork without operating browser buttons: `/assets/brand/manifest.json` lists stable SVG/font URLs and current palette, theme, combination and gradient data. SVG routes are built from the original masters by `src/data/brandDownloads.ts`; there is no duplicate artwork directory. Fonts retain the asset library's AtomsAI-only usage restriction.

The review and implementation decisions are recorded in `docs/skills-review.md`. When brand rules change, update the skill prose and its review metadata, then run `npm run check`, `npm run build` and `npm run check:skills`. The last command checks the built delivery files, links, palette and icon geometry against the canonical data, and checks that the ZIP contains the same Markdown as the individual downloads.

## Figma sources

File `71GQknySbCroHLUwJYdAn2` (AtomsAI-Brand), page **Brand Guidelines (WIP)**, frame `1157:10196`.

| Asset | Figma node |
| --- | --- |
| Mark master | `743:816` (Logo / Mark) |
| Logotype lockup | `1330:27629` (component "Logotype", AtomsAI, 1132 × 200) — Symbol + Wordmark at (280, 20) |
| Color variables | collection "Brand colors" |
| Pattern templates | Drift A `1032:17487–17490`, Offset B `1032:17491–17494`, Single band C `1032:17495–17498` (in "Frame 187"), Concentric `1042:12649`, `1042:12742` |
| Pattern colorways | slides 4.2–4.6 (`1157:11788`, `1157:11807`, `1157:11826`, `1157:11845`, `1274:10177`) |
| Icons | 6.3 Library `1262:7807` (72 px artwork, normalized to 24 px) |
| Illustrations | 7.1 Style `1157:14267`, 7.2 Linework `1157:14345` |
| Diagrams | Logo slides 2.1–2.11 are redrawn in HTML from the master artwork (`src/components/`); Iconography 6.1–6.2 keep their icon strokes as SVG over an HTML grid |
| Examples | Applications 8.1–8.9 `Mockups` frames |
| Mark animation | Not in Figma: the slit logo sketch (`~/Documents/Design/AI/atoms-ai-slit-logo`, `sketch.js` default preset), ported to `src/data/slitLogo.ts`. The reveal's markup matches the sketch's animated SVG export exactly |

### Re-syncing assets

Assets were exported through the Figma MCP server and cleaned with the scripts in `scripts/figma/`:

- `compose_logos.py` builds `logotype.svg` (and optionally `mark.svg`) with `currentColor` from the clean Symbol/Wordmark exports of the "Logotype" component (`--wordmark-at 280 20`). The lockup geometry (kerning, x-height, gap) used by the diagrams lives in `src/data/logos.ts`.
- `extract.py` cuts a single layer out of a node's SVG export, keeps only the defs it references, maps colors (e.g. `white=currentColor`) and namespaces ids so diagrams can be inlined together.
- `icons.py` normalizes the 72 px icon exports to a 24 px grid with `stroke="currentColor"`.
- `minify_rings.py` turns the Concentric mask exports into the files in `public/pattern-masks/`.

The renderer in `src/scripts/pattern-renderer.ts` reproduces the Figma pattern components. Slit structures are drawn from the exact gradient transforms in `src/data/patterns.ts`, and Concentric tints Figma's own ring masks. Compared against Figma's renders of all 14 greyscale templates, every one matches within a mean difference of 5/255 (most under 2/255).

## Fonts

Founders Grotesk (Klim Type Foundry) and PP Neue Montreal (Pangram Pangram) are commercial typefaces. Self-hosting them on a public site requires web licenses from both foundries. Keep this repository and any deployment private until those licenses are confirmed.
