# AtomsAI icon proposals

Twenty-five new icons drawn with the `atomsai-icons` skill. They have not been added to the official library in `src/assets/brand/icons`.

Phone, chat, calendar, sparkle, lock and inbox are in the website Figma file (Components › Icons). They exist there as `Icon/16/*`, `Icon/24/*` and `Icon/24/Regular/*`. In Figma, chat is named `chat-bubble` and sparkle is named `star`.

- `svg/`: `atomsai-icon-<name>-regular.svg` (1.5) and `-medium.svg` (2) for each icon. Medium changes only the root `stroke-width`.
- `preview.png`: Regular on cream and Medium on deep green, at 48, 24 and 16 px, beside the existing masters.
- `construction.png`: each Regular icon at 8×, with the 24-unit grid, the 4–20 live area and red centerlines.
- `preview-microphone-sound-wave.png`: microphone and sound wave at 10× with their construction, then at 72, 24 and 16 px beside masters and proposals, in both weights.

All icons use the shared root settings (`fill="none"`, `currentColor`, miter joins, butt caps) on a 24-unit viewBox. Checks run at 20× for both weights:

- No join falls back to bevel under the default miter limit.
- No painted edge reaches the edge of the canvas.
- Every detached part stays separate in Medium.

## Construction notes

| Icon | Closest references | Notes |
| --- | --- | --- |
| check | chevron-down | 45° polyline, 15 × 10 footprint. |
| menu | filter | Three 16-unit lines at y = 7, 12, 17, the same rhythm as filter. |
| more | info | Short-stroke dots like the info dot. They are 2 units long rather than 1.5, because 1.5 looked too faint at 24 px. |
| home | arrow-up | The roof is the arrow-up head shortened to 14 units. The walls stop with 1.5 units of clearance, like a detached shaft. |
| user | search | Head circle (r 3.5) detached from an elliptical shoulder arc, with 1.5 units of clearance (1.0 in Medium). |
| settings | plus, filter | Two slider rails. Each rail is interrupted around its knob exactly like the plus: 4.5-unit opening, continuous vertical. |
| sparkle | close | Straight-sided four-point star. Its sharp tips overshoot 4–20, as optical compensation for their thinness. |
| chat | — | Closed bubble with a 45° tail. |
| send | arrow-right | Notched triangle. It is shifted 0.5 units right to centre its visual mass. |
| copy | plus | The back sheet ends 2.25 units before the front sheet, the plus gap. |
| edit | arrow-northeast | 45° pencil with an eraser band. |
| trash | filter | Handle, lid and body are separate strokes with 1.5 units of clearance. |
| download, upload | arrow-down, arrow-up | Half-size head on a detached shaft. The shaft enters the V by 1 unit and leaves about 2.4 units of clearance. |
| refresh | chevron-right, search | 270° arc with a detached chevron head at the top, pointing clockwise. |
| link | close | Two 45° brackets with a centre bar that enters each bracket by about 1.4 units. |
| lock | search, home | Detached shackle (r 4.5). Its legs stop at y = 9.75, 1.5 units of clearance above the body (1.25 in Medium). This is the set's disconnected linework, and it was the user's direction on 23 October 2026. It replaces an earlier joined shackle. Body 14 × 8 at y = 12 to 20. Keyhole is a short stem like info. |
| inbox | download, home | Tray with a notched rim (9 to 15, 2.5 units deep), like the download tray. The back wall's slanted sides stop 1.5 units of clearance above the rim corners (about 1.15 in Medium), like the home icon's walls. |
| document | — | Page with a folded corner and two text lines. |
| code | chevron-left, chevron-right | Two half-size chevrons and a steep slash. |
| mail | — | Envelope with a V flap meeting the corners. |
| microphone | search, user | Capsule (r 3) inside a concentric yoke (r 6), with 1.5 units of clearance (1.0 in Medium), like the user icon's head and shoulders. The stem joins the yoke and lands on a 7-unit base. |
| phone | search, chat | Handset. Square earpiece and mouthpiece pads, 4.5 units each, are joined by a quarter-circle spine (r 16, centred at (20,4)) and a straight 45° inner edge. It is symmetrical about the anti-diagonal and has no crossings. |
| calendar | plus, filter | A 16 × 14 body with a header line at y = 10.5. The binding rings (x = 8 and 16, y = 4 to 8) stay continuous. The top edge opens 4.5 units around each ring, as the plus does. |
| sound wave | filter | Five vertical bars, 4 units apart, centred on y = 12. Their heights are 6, 12, 16, 10 and 4. The 16 and 4 match the filter's longest and shortest lines, and the uneven sides stop it reading as a diamond or a level meter. |
