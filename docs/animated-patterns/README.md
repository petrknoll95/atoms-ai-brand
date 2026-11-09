# Animated pattern tool checks

Route: `/atoms-ai-brand/tools/animated-patterns/`, linked under Tools, section 9.3.

Run from the brand repository:

```sh
npm run check
npm run build
npm run dev -- --host 127.0.0.1 --port 4323
PLAYWRIGHT_MODULE=/absolute/path/to/atomsai/node_modules/@playwright/test/index.mjs node scripts/check-animated-patterns.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/atomsai/node_modules/@playwright/test/index.mjs node scripts/compare-animated-patterns.mjs
```

The script uses the website's existing Playwright installation to avoid adding a
new runtime or changing this repository's dependencies. With Playwright installed
locally, omit `PLAYWRIGHT_MODULE`. Override `PATTERN_TOOL_URL` for another server.

`checks.json` records Chromium and WebKit results. The script checks actual canvas
pixel changes during playback, stable paused frames, exact loop endpoints for all
four structures and three palettes, replay, copied name/snippet, still comparison,
reduced motion, offscreen suspension, context recovery, and overflow at 768/390/320px.
Clipboard writes are intercepted to validate contents without OS permission prompts.
Desktop and mobile screenshots record the guide's preview and settings layout.

The comparison script requires the website at `http://127.0.0.1:3001/patterns/motion`
(override `PATTERN_WEBSITE_URL`). It aligns both canvases to 512 × 512 at 25% of the
loop. All 12 structure/colorway frames were byte-identical; see
`website-comparison.json` and the paired Iris PNGs. Mobile screenshots were refreshed
after moving controls ahead of the snippet, with overflow rechecked in both engines.

The shader, model and source tables are byte-identical to the website version
identified in `src/scripts/animated-patterns/README.md`. Iris color constants retain
the website's original override values; the tool does not normalize them to the
existing guide generator's colorways.
