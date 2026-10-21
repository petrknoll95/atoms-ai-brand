# AtomsAI hero prototype

A standalone Astro build of the animated homepage hero, from the "Concept A" frames in the
**AtomsAI — Website** Figma file (node 127:5111).

```sh
npm install
npm run dev     # http://localhost:4321
```

## What it does

The hero is a scroll track. Its stage stays pinned for `--scroll-length` (380svh, set in
`Hero.astro`). The sequence follows a **playhead** that chases the scroll position with a spring,
with its speed capped: the organise phase takes at least 3.6 s and the dive at least 2.4 s, however
fast the page is scrolled. Small scrolls still glide in under a second.

- **On load** the dot field fades in as a slowly drifting, shimmering nebula. It is resampled from
  the actual dot coordinates of Figma frame 01, stretched along each point's local filament, plus
  extra clumps in random orientations. Nothing in it lines up around the centre. The cloud is 3D,
  with clumps at their own depths, and it tumbles slowly.
- **First 42% of the scroll:** the nebula forms concentric rings around a dense core (frame 02),
  the way debris settles into orbits. The copy stays in place. Each nebula dot is paired with a
  ring dot by optimal transport in polar coordinates: radius rank first, then angle within each
  ring. Three acts overlap dot by dot:
  1. **Infall:** the cloud collapses toward the core as it spins up. Inner rings wind further than
     outer ones, so clumps shear into spiral arms.
  2. **The swing:** the field tilts away (with a little yaw), flattening into a disc seen at an
     angle, like a galaxy, then swings back face-on as the arms tighten.
  3. **Lock-in:** each dot spreads out to its ring, overshoots, and pulses (bigger, darker) as it
     locks. Inner rings lock first, so the pulse ripples outward.

  Turbulence peaks mid-way, timing varies smoothly across the cloud so whole clumps move together,
  and moving dots are drawn with motion-blur streaks. The motion depends only on the playhead, so
  it scrubs both ways.
- **The rest of the scroll:** the copy fades out and the camera dives into the centre of the rings.
- **End of the dive:** the camera's target is the single dot at the centre of the core. Every dot
  follows the same true perspective, so the centre dot grows exactly like the dots at its depth.
  A few peers sit right beside it and grow with it until they leave the screen, while dots behind
  it stay smaller. The centre dot fills the screen because it is on the axis.
- **The reveal:** the centre dot is the mask of the next section (`#next`, deep green, the dots'
  colour), which is pinned over the hero and clipped to the dot. The section's content fades in
  as the dot fills the screen; it's empty for now. Header items switch to their cream tone as the
  dot passes under them.
- **Reduced motion:** the page shows the settled rings with no spin and no dive. The field fades
  out with the copy, and the next section crossfades in without the mask.

## Files

- `src/pages/index.astro` composes the page, mounts the field, and holds the next section.
- `src/components/SiteHeader.astro` is the fixed header. Its background fades out over the bottom
  80 px, as in the Figma mask. The logo and icons are the Figma SVGs used as CSS masks, so they can
  switch to cream (`[data-tone='dark']` in `global.css`).
- `src/components/Hero.astro` holds the hero copy, the scroll track and the canvas mount.
- `src/scripts/hero-field.ts` is the p5 sketch. Every tunable is in its `CONFIG`: ring radii and
  density, dot size, nebula warp, where the organise phase ends, depth, dive easing, roll, the
  perspective size law (`dive.sizePower`, 1 = true perspective), and the centre dot's peers.
- `src/data/nebula-01.json` holds frame 01's 3,830 dots, relative to the rings' centre, each with
  its local filament direction. Regenerate it from an SVG export of the frame 01 dots (node
  127:4887) with `node scripts/extract-nebula.mjs <file.svg>`.
- `src/scripts/point-stats.ts` holds the point-pattern statistics the nebula was tuned against
  (dev only).
- `src/styles/global.css` holds the Forest Light tokens from `docs/website/tailwind-theme.css`, as
  plain CSS.
- `public/images` holds the logo and icons, exported from Figma. `public/fonts` holds the brand
  fonts.

## Prototype helpers

In dev, two console helpers are available:

- `heroField.pin(seconds)` freezes the clock that drives the fade-in, nebula drift and ring spin.
  `heroField.pin(null)` releases it.
- `await heroField.seek(t)` jumps the playhead to track progress `t`, skipping the speed cap.
- `await heroField.simulate(frames, fps)` draws frames as if real time passed and returns the
  playhead after each one. This checks the speed cap independently of the frame rate. At 60 fps, a
  flick straight to the rings plays the organise phase over about 4 s.
- `await heroField.stats()` compares the frame on screen with Figma frame 01's dots. It reports
  how much the dots line up around the centre (`tangential`), how periodic the radial density is
  (`ringScore`), how clumped the dots are (`clarkEvans`, `dispersion`, `outerDispersion`), and the
  share of dots in the core (`coreShare`).

At 1600 × 900 the nebula measures as follows:

| measure | nebula | frame 01 | settled rings |
| --- | --- | --- | --- |
| tangential (alignment around the centre) | 0.05 | 0.11 | 0.81 |
| ringScore (radial periodicity) | 0.35 | 0.31 | 1.03 |
| clarkEvans (lower is clumpier) | 0.58 | 0.63 | — |
| outerDispersion (clumping beyond the core) | 3.7 | 2.2 | — |
| coreShare (dots in the core) | 0.28 | 0.29 | — |

So the nebula is less concentric and clumpier than frame 01, with the same core weight.
