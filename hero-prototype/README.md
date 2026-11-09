# AtomsAI hero prototype

A standalone Astro build of the animated homepage hero, from the "Concept A" frames in the
**AtomsAI — Website** Figma file (node 127:5111).

```sh
npm install
npm run dev     # http://localhost:4321
```

## What it does

The hero is a scroll track. Its stage stays pinned for `--scroll-length` (380svh, set in
`Hero.astro`). The sequence is **scrubbed**: it maps to the scroll position, with only a short
glide (`scroll.smoothing`, about 0.1 s) so wheel notches don't step. It never plays on its own.
The long track (160svh for the transition) is what gives the transition room.

- **On load** the dot field fades in as a slowly drifting, shimmering nebula. It is resampled from
  the actual dot coordinates of Figma frame 01, stretched along each point's local filament, plus
  extra clumps in random orientations. Nothing in it lines up around the centre. The cloud is 3D,
  with clumps at their own depths, and it tumbles slowly.
- **First 42% of the scroll:** the nebula rearranges into concentric rings around a dense core
  (frame 02). The copy stays in place.
  - Every dot takes the shortest path: a straight line to its ring slot, easing in and out.
  - Nebula dots are paired with slots to minimise total squared travel (optimal transport). The
    pairing starts in polar coordinates, then swaps pairs wherever that shortens them, which also
    untangles crossing paths.
  - Timing varies smoothly across the cloud, inner rings first, so neighbouring dots move
    together.
- **The rings turn as you scroll**, like swarms. Alternate rings (and core bands) turn in opposite
  directions, inner ones further. Each dot runs a little faster or slower than its ring and drifts
  in and out, so groups loosen and regroup. The rotation is tied to the scroll position too, so
  the dots head for slots that are themselves turning.
- **Motion blur:** moving dots get short streaks, capped for fast flicks.
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
  density, dot size, nebula, where the organise phase ends, transition timing, the swarm's turn,
  spread and wobble, depth, dive easing, roll, the perspective size law (`dive.sizePower`, 1 = true
  perspective), and the centre dot's peers.
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
- `await heroField.seek(t)` jumps the playhead to track progress `t`, skipping the glide.
- `await heroField.simulate(frames, fps)` draws frames as if real time passed and returns the
  playhead after each one. This checks the glide independently of the frame rate. At 60 fps, a
  flick to the end of the transition is 90% there in 0.15 s.
- `heroField.pairing()` reports the mean straight-line distance from nebula dot to slot, and the
  share of crossing paths. The rework took these from 470 px and 3.6% to 318 px and 0.27%.
- `heroField.swarm()` lists each ring's turn over the track (signed), with its spread.
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
