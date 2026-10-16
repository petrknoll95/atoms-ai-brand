---
name: atomsai-icons
description: Create or refine SVG interface icons that match the AtomsAI stroke library. Use when a new AtomsAI icon is needed, an existing icon must be adapted, or SVGs need checking for grid, stroke, sharp joins, butt caps and open crossing gaps.
metadata:
  version: "1.0"
  reviewed: "2026-10-16"
---

# AtomsAI icon creation

Create minimal, precise SVG icons that belong beside the existing AtomsAI stroke set. This is a UI icon system, not the brand logo, interference patterns, dot-grid artwork or isometric illustration system.

## Workflow

1. Identify the icon's meaning, use, target size and required weight. Reuse an existing icon when it expresses the same meaning.
2. Inspect the closest existing masters using the links below. Use a simple, recognizable silhouette and as few strokes as the meaning permits.
3. Draw on the 24-unit grid with the shared SVG settings. Apply the set's open-gap construction where strokes cross or an arrow shaft approaches its head.
4. Render beside at least two relevant reference icons at 24 px and the intended usage size. Check both 1.5 and 2 weights if delivering both, on light and dark surfaces.
5. Return editable standalone SVG files, the selected weight and a brief note on the closest references and any optical adjustment. Do not add new artwork to the official library unless the user requests that change.

This skill works with any agent capable of producing SVG text. Browser/design tools help inspection but are not mandatory. If rendering or fetching references is unavailable, use the embedded masters and state what could not be visually checked.

Source: [icon guideline](https://petrknoll95.github.io/atoms-ai-brand/icons/) and [download manifest](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/manifest.json). Current masters and written rules take precedence over this snapshot, reviewed 16 October 2026.

## Required construction

| Property | Requirement |
| --- | --- |
| Canvas | `width="24" height="24" viewBox="0 0 24 24"` with SVG namespace. |
| Fill | `fill="none"`; no filled silhouettes or background patches. |
| Ink | `stroke="currentColor"` for reusable inline SVG. One color throughout. |
| Regular | `stroke-width="1.5"`; default, paired with body and interface text. |
| Medium | `stroke-width="2"`; paired with headlines/Medium labels; can help at small sizes. |
| Corners | `stroke-linejoin="miter"`; sharp angular joins. Never round or bevel them. |
| Endpoints | `stroke-linecap="butt"`; flush ends. Never round or square-projecting caps. |
| Scaling | Uniformly scale the full icon and stroke together. Do not use `vector-effect="non-scaling-stroke"`. |
| Crossings | Deliberate transparent interruptions; preserve the continuous primary stroke. |

Do not use variable strokes, gradients, shadows, textures, 3D perspective, decorative outlines or a generic icon set with rounded corners. Curved geometry is allowed where the meaning requires it: the search lens is a true circle. “Sharp joins” does not mean every object must be a polygon.

## Grid, silhouette and optical weight

The following are observations from the supplied artwork, useful for extending the set. They are not additional universal brand measurements:

- Most full-sized forms use centerlines between **4 and 20**, centered around **(12,12)**. That is roughly a 16-unit drawing within a 24-unit canvas.
- Centerline bounds are not painted bounds: strokes extend beyond them by half their weight, and miter corners project farther. Leave room for the actual painted contour; never clip the viewBox.
- Chevrons use a smaller 12 × 6 or 6 × 12 centerline footprint. A minus and info icon are intentionally narrow. Do not stretch every symbol to the same rectangle.
- Straight segments and 45° diagonals dominate. Use integer and simple fractional coordinates when they preserve the intended balance. Decimal offsets are legitimate for optical gaps; do not round them away.
- Compare perceived size and darkness with adjacent masters, not only numeric bounds. Simplify a dense symbol before reducing its stroke width or shrinking it dramatically.
- Start at Regular. The existing Medium variant changes only the root stroke width, preserving geometry and gaps. Check it visually; a new design may need simplification to remain clear in both weights.

## The signature open gaps

These gaps are negative space in the SVG itself. Build them by ending and restarting paths with separate `M` commands or elements. Do not paint white or surface-colored rectangles over a crossing: those break on other backgrounds.

### Plus: continuous vertical, interrupted horizontal

The vertical runs from `(12,4)` to `(12,20)`. The horizontal ends at `x=9.75` and resumes at `x=14.25`, both at `y=12`. This leaves a **4.5-unit centerline opening**, with **1.5 units of visible clearance on each side** of the Regular vertical stroke; Medium leaves 1.25 units. Do not join the horizontal through the center.

### Close: one continuous diagonal

The descending diagonal runs `(5,5)` → `(19,19)`. The rising diagonal runs `(5,19)` → `(10.6,13.4)`, then `(13.4,10.6)` → `(19,5)`. The omitted length along that diagonal is about 3.96 units; the drawn shapes remain separated after stroke width is applied. Do not turn the crossing into a solid X.

### Arrows: a detached shaft and connected head

The right arrow shaft runs `(4,12)` → `(14.5,12)`; the head is a continuous path `(12,4)` → `(20,12)` → `(12,20)`. The shaft stops **5.5 units before the tip**, leaving visible negative space around the head. This is not a 5.5-unit gap to the nearest painted edge. Preserve connected, sharp head corners; never split a chevron at its apex.

Up, left and down are rotated counterparts. The northeast arrow uses shaft `(5,19)` → `(14.5,9.5)` and a separate right-angle head `(9,5)` → `(19,5)` → `(19,15)`.

### Search: lens and detached handle

The lens is a circle centered at `(10.5,10.5)` with radius `5.5`. Its handle runs `(15.9,15.9)` → `(20,20)`. Preserve the small separation between the circular contour and diagonal handle at both weights; do not merge them or use a filled magnifying glass.

For a new crossing, follow the closest construction and inspect the remaining negative space at final size. There is no single gap number that works for every angle. Do not add arbitrary breaks to every joined corner or closed shape.

## Reference geometry

These are the actual Regular masters. All coordinates are in the 24-unit viewBox.

| Icon | Path data or geometry |
| --- | --- |
| arrow-right | `M4 12H14.5M12 4L20 12L12 20` |
| arrow-left | `M20 12H9.5M12 20L4 12L12 4` |
| arrow-up | `M12 20V9.5M4 12L12 4L20 12` |
| arrow-down | `M12 4V14.5M20 12L12 20L4 12` |
| arrow-northeast | `M5 19L14.5 9.5M9 5H19V15` |
| chevron-right | `M9 6L15 12L9 18` |
| chevron-left | `M15 18L9 12L15 6` |
| chevron-up | `M6 15L12 9L18 15` |
| chevron-down | `M18 9L12 15L6 9` |
| plus | `M12 4V20M4 12H9.75M14.25 12H20` |
| minus | `M4 12H20` |
| close | `M5 5L19 19M5 19L10.6 13.4M13.4 10.6L19 5` |
| filter | `M4 7H20M7 12H17M10 17H14` |
| info | `M12 5.75V7.25M12 10V19` |
| search | Path `M15.9 15.9L20 20`; circle `cx="10.5" cy="10.5" r="5.5"`. |

Filter is three centered horizontal lines of lengths 16, 10 and 4 at y=7, 12 and 17, not a funnel. Info is an unframed vertical stem and a short stroke for its dot, not a circle-enclosed “i”. A circular badge in a button is a separate UI treatment, not part of the master icon.

## SVG examples

Use this exact Regular plus as a structural reference. For a new symbol, retain the root settings and replace the geometry with the requested form.

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="butt">
  <path d="M12 4V20M4 12H9.75M14.25 12H20"/>
</svg>
```

Search demonstrates a circle and a deliberately detached handle:

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
  viewBox="0 0 24 24" fill="none" stroke="currentColor"
  stroke-width="1.5" stroke-linejoin="miter" stroke-linecap="butt">
  <path d="M15.9 15.9L20 20"/>
  <circle cx="10.5" cy="10.5" r="5.5"/>
</svg>
```

For Medium, set the root `stroke-width` to `2` without adding child overrides. Keep paths editable; do not convert strokes into filled outlines merely to produce a vector file. Flatten unnecessary transforms when practical, but preserve the geometry and transparent gaps.

## Color, scale and use with type

- Available asset inks: Deep green `#27433B`, Cream `#F6F1E8`, Black `#000000`, White `#FFFFFF`. Use Deep green on light surfaces, Cream on Deep green, or the corresponding monochrome pairing. Verify contrast on the actual background.
- Inline icons inherit the label color. For standalone SVG imports, replace `currentColor` with the chosen HEX when the host cannot inherit CSS; an external SVG image does not inherit the surrounding page's text color.
- At rendered size `S`, stroke thickness is `S × 1.5 / 24` for Regular or `S × 2 / 24` for Medium. At 16 px this is 1 px or approximately 1.33 px; at 32 px, 2 px or approximately 2.67 px.
- Align the drawing optically with the label's capitals, accounting for the SVG's internal whitespace. The guide's button specimen uses a 1.5-cap-height box so the usual 16/24 drawing aligns with cap height; treat that as a useful implementation example, not a required size for all controls.
- Keep a consistent icon-to-label gap. Put an action icon before the label and a navigation arrow after it. Keep icon size separate from the control's hit area.
- For accessible interfaces, hide a redundant decorative icon from assistive technology and put the accessible name on the control. Give a meaningful standalone icon an appropriate label; avoid duplicate announcements beside visible text.

Preview: [icons in use](https://petrknoll95.github.io/atoms-ai-brand/icons/#in-use). Broader styling: [brand skill](https://petrknoll95.github.io/atoms-ai-brand/skills/atomsai-brand/SKILL.md).

## Reference downloads

These links return SVG, not a browser-only download action:

- [Regular right arrow](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/arrow-right.svg)
- [Regular plus](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/plus.svg)
- [Regular close](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/close.svg)
- [Regular search](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/search.svg)
- [Regular filter](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/filter.svg)
- [Regular info](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/regular/info.svg)
- [Medium plus](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/medium/plus.svg)
- [Medium search](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/icons/medium/search.svg)

All 15 names in both weights are listed in the [manifest](https://petrknoll95.github.io/atoms-ai-brand/assets/brand/manifest.json). View enlarged grid diagrams at [style](https://petrknoll95.github.io/atoms-ai-brand/icons/#style) and [weight](https://petrknoll95.github.io/atoms-ai-brand/icons/#weight).

## Acceptance and delivery

- Meaning is immediately recognizable and the silhouette feels balanced beside the existing set.
- SVG parses; namespace and 24-unit viewBox are present; no raster images, text glyph dependencies, scripts, external resources or unnecessary background.
- Every visible line shares the selected stroke width, miter joins, butt caps and one ink. Circular shapes remain geometric curves, not rounded stroke endpoints.
- Crossings and detached elements remain visibly separated in Regular and Medium, including at the requested smallest size. Gaps are transparent on both light and dark backgrounds.
- No clipped miter tips, accidental path closures, doubled strokes or nonuniform transforms. Final-size rendering is inspected, not only a large zoom.
- Supply `atomsai-icon-<meaning>-regular.svg` and, when requested, `atomsai-icon-<meaning>-medium.svg`. If a PNG is requested, rasterize the SVG with transparency at the requested size (the site's default is 512 px) and retain the editable SVG.
