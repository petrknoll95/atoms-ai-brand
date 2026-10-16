# Skills delivery review

Reviewed 16 October 2026 against the repository's guideline pages, shared data, SVG masters, diagrams, all nine application mockups, generators, export helpers, site shell and deployment configuration. The existing `.claude/launch.json` edit is unrelated and preserved.

## Sources and decisions

| Area | Authority | Skill treatment |
| --- | --- | --- |
| Identity and language | `index.astro`, `logo.astro`, logo masters and construction diagrams | Preserve the exact name, artwork, lockup, placement, clear space and minimum size. Describe the voice from the guide's own copy, without inventing claims. |
| Color | `colors.ts`, `color.astro` | All 18 tokens, published CMYK values, six combinations, nine foreground/background pairs, exact gradient recipes through a generated manifest. |
| Typography | `typography.astro`, font assets, global CSS | Separate headline rules from lead/body defaults and specific specimens. The shell's two sizes are not a universal brand type scale. |
| Icons | All 15 SVGs, four diagram SVGs, `icons.ts`, `icons.astro`, export normalization | 24-unit canvas, 1.5/2 strokes, miter/butt, measured centerlines, optical bounds and transparent interruptions. Show real master examples. |
| Patterns | `patterns.ts`, renderer, generator, usage tiles | Four structures and four published colorways. Preserve the existing generator, including intermediate slit stops and two Concentric presets. |
| Illustration | Nine SVGs and `illustration.astro` | Distinguish open concept drawings (small solid nodes allowed) from surface-filled opaque isometric objects. |
| Motion | `slitLogo.ts`, `SlitMark`, `MarkReveal`, video renderer | Current 4 s cycle, 0.88 s moves, 0.2 s pair stagger. Link to the working tool rather than reproduce the old plan's 1.28 s claim. |
| Applications | All nine example images | References for composition, not new rules. Current written rules outrank legacy details in mockups. |
| Delivery | Astro static build, base URL helper, browser-only asset exports | Add static SVG URLs and a manifest so an agent can fetch artwork without executing the website. |

## Ambiguities resolved without changing the brand

- The logotype text prescribes Cream/Deep green pairings while the download control also offers Black and White. Recommend the prescribed pairings; identify monochrome files as available variants, not permission for arbitrary recoloring.
- Typography prose says display 100%, lead 130%, body 140%; specimens show display 80/90% and lead 32/120%. Keep defaults and specimens distinct.
- Pattern copy mentions two colorways, but the data and generator publish Forest, Sage, Graphite and Iris. Describe the actual four presets; Forest remains default and Iris remains occasional.
- Concentric copy says “two finer densities”; actual masks and generator use density indices 1 and 2, shown as 10 and 20. Keep these exact presets and do not claim 20/40.
- Illustration “no fills” describes concept surfaces; small solid nodes exist in the masters. Isometric linework deliberately uses opaque surface fills.
- Icon artwork is usually within centerlines 4–20, but chevrons, diagonals and info vary. This is observed geometry, not a mandatory box. Never turn every junction into a gap: arrow/chevron bends stay connected.

## Implementation plan

1. Author two ordinary, self-contained `skills/<name>/SKILL.md` files with portable YAML metadata, core rules first, task-specific sections, real source links and final checks. No vendor-specific tool requirements or install scripts.
2. Publish the existing SVG masters through static, stable URLs. Generate the asset manifest and exact color/gradient/theme data from the existing modules.
3. Add Skills to the existing navigation and contents. The library starts directly with two linked cards. Each skill has its own `/skills/<name>/` page with an open formatted preview, raw Markdown view, copy action and `.md` download. Offer a ZIP with the standard folder structure.
4. Use the same source for preview, clipboard and download. Rewrite the configured production URL in generated delivery files when the deployment origin/base changes.
5. Verify type checking and static build; validate frontmatter, palette/geometry fidelity, all local links and anchors, download equality, manifest targets, and SVG parsing. Exercise copy, preview toggles, downloads and responsive layout in the browser.

## Format reference

The [Agent Skills specification](https://agentskills.io/specification) defines the `SKILL.md` directory convention and `name`/`description` frontmatter. A plain Markdown attachment remains usable when a host does not implement skill discovery. The package makes no claim of testing every model or host.

## Validation completed

- Both source files pass the skill frontmatter validator.
- `npm run check`: zero errors and warnings; one existing deprecation hint for the shared clipboard fallback.
- `npm run build`: successful static build, with no build warnings.
- `npm run check:skills`: two skills, 18 palette values, nine themes, six combinations, 15 icon masters, 55 downloadable assets and 114 local URLs/anchors verified. Source, clipboard payload, individual download and ZIP entries match.
- All 51 generated SVGs parse as XML with an SVG namespace and viewBox.
- Browser checks at desktop width and 375 × 812: library cards and sidebar links open separate skill pages, each preview is open by default, Preview/Markdown tabs and copy actions work, and both the library and detail pages have no horizontal overflow. Keyboard arrow and Home controls were also verified during initial implementation. No browser warnings or errors were recorded.
- Both `.md` files and the ZIP downloaded through the actual page controls and match the built files byte for byte.

Validation used the production build served locally. The new public skill and asset URLs become available when this change is deployed; no production deployment was performed as part of implementation.
