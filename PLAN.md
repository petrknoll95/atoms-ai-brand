# AtomsAI Brand Library — Implementation Plan

## Context

The AtomsAI brand guidelines live in Figma ("Brand Guidelines (WIP)", node `1157:10196`): about 75 slides covering Intro, Logo, Color, Patterns, Typography, Iconography, Illustration and Applications. They're hard to use day to day: you can't copy a hex value, grab a logo in the right color or make a pattern without opening Figma.

This repo (empty, `main`, no commits yet) will become a lightweight **Astro** site that presents the guidelines and works as the asset library. It will use the real brand fonts, the 18 brand colors as CSS variables, and interactive copy/download tools.

### Decisions (confirmed)
- **Icons:** stroke icon system (Iconography B) only. The dot-grid set (A) is dropped.
- **Patterns:** a **live generator** rebuilt from the Figma layer model, not static exports.
- **Examples:** the 9 application mockups as exported images.
- **App icon:** official colorway only (Cream mark on Deep green), in rounded-square and circle forms.

---

## What the Figma file defines (source of truth)

**Colors.** 18 variables in the "Brand colors" collection:

| Group | Tokens |
|---|---|
| forest | forest-shade `#10231E`, deep-green `#27433B`, forest-green `#42665A`, sage `#668978`, sage-tint `#94AC96`, stone `#C7CDBA`, cream `#F6F1E8` |
| neutral | charcoal `#33413D`, graphite `#58625F`, slate `#7E8583`, ash `#A7AAA9`, mist `#D0D1D1`, paper `#FAFAFA` |
| iris | iris-shade `#493F58`, iris `#8C78B0`, iris-tint `#D8CDE5` |
| mono | black `#000000`, white `#FFFFFF` |

The file also defines Primary/Secondary/Accent roles (with RGB and CMYK), two 7-step ramps, 6 combinations (60/30/10), 8 gradients, and 9 themes (Forest, Neutral and Iris × Light, Mid and Dark, each with a stated contrast ratio).

**Type.** Founders Grotesk Regular and Medium for display (leading 90–100%, tracking −1.5%). PP Neue Montreal Regular and Medium for body and UI (body line-height 140%).

**Logo.** One master mark vector (`743:816`). The logotype lockup is the mark plus a custom-kerned "AtomsAI" wordmark (`1157:10615`). The wordmark's cap height is 80% of the mark's height, and the gap is 0.3X. Clear space is X/2 for the mark and X for the logotype. The logotype has a minimum size of 100 px (digital) and 25 mm (print). The mark reveal animation runs 1.28 s with `cubic-bezier(0.7, 0, 0.3, 1)`. The file also covers name-in-copy rules and the app icon (mark spans 60% of the container).

**Patterns.** There are four structures: Drift (A), Offset (B), Single band (C) and Concentric. Densities are 5, 10, 20 and 40 slits; Concentric only comes in the two finest. Colorways are Forest and Iris. Each template is the same stack of layers:
- a base color
- three solid fields (Upper, Lower, Highlight), each masked by a luminance mask of slit rects or ring ellipses filled with radial gradients, with an optional ~1.9 px blur
- a Reflections layer, blended with linear dodge or hard light

This can be reproduced in Canvas 2D.

**Fonts on this machine:**
- `~/Documents/GitHub/fonts/Foundries/Klim Type Foundry/FoundersGrotesk/FoundersGrotesk-{Regular,Medium}.otf`
- `~/Documents/GitHub/fonts/Foundries/Pangram Pangram/Neue Montreal/woff2/PPNeueMontreal-{Regular,Medium}.woff2`

---

## Shell design

- White background.
- **Two colors:** `--fg` is Deep green `#27433B`. `--muted` is Graphite `#58625F`, which has 6.4:1 contrast on white (Slate would fail AA for small text).
- **Two sizes:**
  - Display: Founders Grotesk Regular 32/1.0 at −1.5% tracking, for section and sub-section titles.
  - Annotation: PP Neue Montreal Regular 14/1.4, for everything else (nav, prose, labels, buttons, "Copied" feedback).
- These limits apply to the shell only. Brand specimens (type ramps, swatches, artwork) are content and render at whatever size they need.
- Layout: a fixed left sidebar (about 220 px) and a content column on the right. Hairline dividers in `--muted` at low opacity. No other decoration. This mirrors the slide layout in the guidelines.
- The sidebar lists every section with its sub-sections. The current page is shown in `--fg` and everything else in `--muted`, with scroll-spy on sub-section anchors. On mobile the sidebar collapses to a top "Menu" disclosure.

### Sidebar map (one page per section, sub-sections are anchors)

| Section | Sub-sections |
|---|---|
| Intro | About this guide |
| Logo | Mark · Logotype · Clear space · Placement · Minimum size · App icon · Mark reveal · Name in copy |
| Color | Palette · Primary · Secondary · Accent · Shades · Neutrals · Combinations · Gradients · Themes |
| Typography | Typefaces · Character set · Scale & line-height · Headlines |
| Icons | Style · Weight · Library · In use |
| Patterns | Structures · Density · Colorways · Generator · Usage |
| Illustration | Style · Linework |
| Examples | Social · Out of home · Print |

---

## Architecture

**Stack:** Astro (latest stable), TypeScript and plain CSS. There is no UI framework: interactivity comes from small vanilla `<script>` modules that Astro bundles. The output is a static build, so it can be hosted anywhere.

```
public/fonts/                FoundersGrotesk-{Regular,Medium}.woff2, PPNeueMontreal-{Regular,Medium}.woff2
src/data/
  nav.ts                     sections + sub-sections (drives sidebar & pages)
  colors.ts                  single source: 18 tokens + roles, RGB/CMYK, ramps, combos, gradients, themes
  logos.ts                   logo variants + the 4 download colors
  icons.ts                   15 stroke icons (name + SVG)
  patterns.json              layer spec extracted from Figma (structure × density) + colorways
src/assets/brand/            logo/, diagrams/, icons/, illustration/, examples/, usage/  (exported from Figma)
src/styles/                  fonts.css (@font-face), global.css (shell: 2 sizes, 2 colors)
src/pages/tokens.css.ts      static endpoint that generates :root { --deep-green: … } from colors.ts
src/layouts/Guide.astro      sidebar + content shell, links /tokens.css
src/components/              Sidebar, Section, Swatch, AssetCard, PatternGenerator, MarkReveal, TypeSpecimen, Figure
src/scripts/                 clipboard.ts, download.ts (SVG blob, SVG→PNG via canvas), pattern-renderer.ts, contrast.ts
src/pages/                   index (Intro), logo, color, typography, icons, patterns, illustration, examples
```

**Color variables.** `colors.ts` is the only place hex values live. `/tokens.css` turns them into `--forest-shade`, `--deep-green`, and so on, named after the Figma variables. The layout links that file, and the site offers it as a copy/download ("Copy CSS variables").

**Fonts.** Copy the PP Neue Montreal Regular and Medium woff2 files as they are. Convert the Founders Grotesk Regular and Medium OTFs to woff2 with `fonttools`; `brotli` gets installed into a throwaway venv in the scratchpad. Use `font-display: swap` and preload the two shell faces.

> ⚠️ Licensing: both families are commercial. Self-hosting them on a public URL needs web licenses from Klim and Pangram Pangram. Keep the repo and site private, or confirm the licenses before deploying.

---

## Section-by-section build

### Logo
- **Asset cards** for Mark and Logotype. Each card has a color picker (Black, Deep green, Cream, White) and three actions:
  - **Copy SVG** to the clipboard
  - **Download SVG**
  - **Download PNG**, rendered client-side on a transparent canvas at 2400 px on the long edge
- Implementation: one master SVG per variant with the fill swapped at runtime, so nothing is duplicated.
- Cream and White previews sit on a Deep green tile so they're visible. The others sit on white with a hairline border.
- **App icon:** rounded square (radius ≈ 17.4%) and circle, Cream on Deep green, mark at 60% width. Composed at build time from the master mark path. SVG and PNG downloads.
- **Diagrams** (construction, clear space, kerning, height ratio, gap, placement, minimum size) are exported from Figma as SVG and inlined with guideline copy.
- **Mark reveal:** a replayable SVG/CSS recreation (circles slide inward through clip-path slits, using the documented timings and easing), with a Replay button. Respects `prefers-reduced-motion`.
- **Name in copy:** do/don't list set in live type.

### Color
- Every swatch is a button. Clicking it **copies the hex** and shows a "Copied #27433B" annotation in an `aria-live` region.
- Palette overview, Primary, Secondary and Accent with RGB/CMYK, both 7-step ramps, and the 6 combinations at 60/30/10 proportions.
- Gradients are rendered with CSS. Clicking one copies its CSS `linear-gradient`.
- Themes render live "Aa" cards. The contrast ratio and WCAG level are **computed** in `contrast.ts` and cross-checked against the Figma values (9.6, 5.7, 14.56, …).

### Typography
- Typeface cards for Founders Regular, Founders Medium and Neue Montreal Regular.
- Character set (all 8 glyph groups).
- Scale & line-height specimens: Display 80/90%, Display 32/120%, Body 16/140%.
- Headline rules (leading 90–100%, tracking −1.5%) with a before/after example.
- Specimens are `contenteditable`, so people can try their own copy.

### Icons (stroke set B)
- Style rules (miter joins, butt caps) and weight (Regular 1.5 px, Medium 2 px at 24 px).
- **Library:** all 15 icons in an asset grid. The same color picker and copy/download actions as the logos, plus a **1.5 / 2 px weight toggle** (it rewrites `stroke-width`).
- **In use:** live HTML buttons ("Learn more →", Search, Filter, …) built from brand type and the icons.

### Patterns (live generator)
1. **Extract the spec.** A read-only `use_figma` script serializes each template into `patterns.json`, deduplicating gradient stops shared across slits. That covers Drift, Offset and Single band at densities 0–3, and Concentric at densities 1–2. For each layer it records:
   - geometry: slit rects or ring ellipses
   - radial-gradient stops and transforms
   - blur
   - blend mode
   - which color role (Base, Upper, Lower or Highlight) fills it

   The Forest and Iris colorways for each structure come from the guideline slide instances.
2. **Renderer** (`pattern-renderer.ts`, Canvas 2D):
   - For each field layer, draw the luminance mask offscreen (radial gradients via transformed `createRadialGradient`, then `ctx.filter = blur()`), and use it as alpha for a solid fill.
   - Composite onto the base, with `lighter` for linear dodge and `hard-light` where specified.
3. **Generator UI:** structure, density, colorway (Forest/Iris), aspect preset (1:1, 4:5, 9:16, 16:9 or custom W×H), rotation (0°, 90° or 45°) and scale/crop. Then **Download PNG** at the chosen pixel size.
4. **Guardrails** follow the Usage page:
   - Only the published colorways are offered (no free recoloring).
   - The field is always scaled uniformly and cropped, never stretched.
   - One structure per render.
5. The Structures, Density and Colorways sub-sections use the same renderer, so the docs and the tool can't drift apart.
6. The Usage do/don't tiles are exported from Figma as images. The "don't" tiles can't come from the guarded generator by design.

### Illustration
- Style (3 concept drawings: Full Visibility, Built In Your Stack, Compounding Outcomes) and Linework (6 isometric objects).
- Exported from Figma as SVG, shown with the guideline copy, with SVG and PNG download in their original colorway.

### Examples
- The 9 application mockups (social profile/posts/stories, office screen, transit poster, vertical banner, office display, event access cards, business cards) exported from Figma at 2×.
- Optimized through `astro:assets`, shown in a captioned grid grouped as Social, Out of home and Print. Clicking an image opens it full size.

### Intro
- Title, the "About this guide" copy, and an index of sections. A mark reveal plays once on load.

---

## Asset extraction (done once during implementation, committed to the repo)

All extraction is read-only against Figma via the MCP:
- **SVG:** `node.exportAsync({ format: 'SVG_STRING' })` through `use_figma`. This was verified to give clean output for the mark and logotype.
- **Raster:** `download_assets` at 2× for the mockups and usage tiles.

All copy text comes from the slides verbatim. The source node IDs are recorded in a `README.md` table so assets can be re-synced when the WIP file changes.

## Implementation order (with checkpoints)
1. Scaffold Astro, then build fonts, tokens and the shell (sidebar, 2 sizes, 2 colors, responsive). → screenshot check
2. Extract all assets, copy text and the pattern spec from Figma.
3. Color page (swatches, copy, themes, contrast).
4. Logo page (asset cards, SVG/PNG export, app icon, diagrams, reveal).
5. Typography, Icons, Illustration, Examples, Intro.
6. Pattern generator. This is the highest-risk step: compare its renders side by side with Figma screenshots for every structure and colorway.
7. Polish: keyboard and focus states, reduced motion, mobile layout, `npm run build` clean.

## Verification
- `npm run build` succeeds with no warnings, and `npm run dev` gets previewed in the in-app browser. Walk every section at desktop width and at 375 px.
- **Clipboard:** click swatches, then read the clipboard to confirm the exact hex. Copy SVG for each logo color, then paste it to check it's valid SVG with the right fill.
- **Downloads:** for each logo variant × color, check that the SVG parses and the PNG has an alpha channel with transparent corners (inspect with `sips`/Python), and that dimensions match 2400 px on the long edge.
- **Patterns:** for each structure × density × colorway, compare the generator render against a Figma screenshot of the same template. Confirm crop and rotate never distort the field.
- **Contrast:** computed ratios match the Figma theme slides.
- **Shell constraints:** grep the shell CSS to confirm only the two font-size and two color tokens are used outside content specimens.
