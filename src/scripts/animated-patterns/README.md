# Animated website patterns

This directory vendors the website's framework-independent WebGL2 renderer from
`atomsai/src/components/patterns`, commit
`656497e51676e4ec777d06f2e28b972fa59e3973` (26 October 2026).

`renderer.ts`, `shaders.ts`, `model.ts`, `concentric.ts`, `source-data.ts`, and
`motion-presets.ts` are unchanged copies. `types.ts` only removes the React view
props; `palettes.ts` derives Iris overrides from the current brand palette and converts sRGB to Display P3 for the renderer. No texture images,
React integration, or new runtime dependencies are required.

`tool.ts` adapts the renderer to Astro and the guide's existing Tweakpane theme,
clipboard helper, notifications and responsive preview/panel layout. The copy
name is **MotionPattern**, the actual exported React component in the website.
Configured snippets require that component to be present and a parent with an
explicit height; they are not a standalone npm package.

The four structures use their website values and source-derived geometry. Linear
patterns default to Light Tide (12 seconds); Concentric defaults to Expanding
Waves (8 seconds). Both default to intensity 0.7. Other website motion studies
remain available. The Iris override follows the current brand palette. The existing still-pattern generator and its
density conventions are unchanged. This tool labels the website's Concentric
counts as **rings** (15 and 29), rather than relabeling them as guide slits.

The source-data comments reference source evidence in the **website repository**:
`docs/patterns/source`, `docs/patterns/homepage-source.json` and the theme-variable
captures. They are not paths in this brand repository.

Motion only updates the final composite pass; cached masks are rebuilt on geometry,
palette or size changes. Rendering is capped at 30 fps and 1024 pixels on the long
edge, matching the website. Hidden/offscreen previews pause. Reduced motion disables
automatic playback and replay but permits manual frame inspection. Context loss
shows an explicit fallback and recovery rebuilds the renderer.

To update, copy the six renderer files together from the website, reconcile the
shared types/palettes, record the new source commit here, then run the browser
checks. Keep shader changes in the website as the source of truth.
