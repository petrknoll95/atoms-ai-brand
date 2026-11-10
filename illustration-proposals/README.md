# AtomsAI illustration proposals

Three illustrations drawn with the `atomsai-illustrations` skill: one user, two users and three users. They are in the gallery as `one-user`, `two-users` and `three-users`, at the end of Illustration › 7.2 Linework. See [Gallery](#gallery).

- `svg/`: `atomsai-illustration-<name>-dark.svg` and `-light.svg` for each illustration. These are neutral-view exports from the skill's runner: transparent, 384 × 384, stroke 1.28. They contain gradient and mask IDs (`iris-0`, …), so namespace them when you put several inline on one page.
- `recipes/`: the editable scenes. `one-user.mjs` holds the shared figure and geometry checks; the two group recipes import it.
- `preview.png`: all three on Dark and Light at a 300 px viewport (1 px stroke).
- `review/`: the runner's contact sheets. Each shows the neutral, oblique, back and underside views on both surfaces, beside the Input reference.

## Construction

| Part | Notes |
| --- | --- |
| Figure | A sphere head (r 35) rests on the apex of a half-ellipsoid of shoulders (70 × 60 × 70), touching at one point on their shared vertical axis. A base disk closes the solid without adding a stroke. The proportions are the user icon at 10×: shoulders 14 × 6, head r 3.5. |
| Two users | The same figure twice, 160 apart on the Z axis: shoulder diameter 140 plus 20 of clearance. A 180° turn about the vertical axis generates the second. |
| Three users | Three figures at 120° steps on one circle of radius 160/√3, so every pair is 160 apart. The group is mirror-symmetric about the front user. |
| Iris | Only the head of the user nearest the viewer. |
| Hidden lines | Opaque solids (`hiddenLines = 'omit'`), as in Always on and Versatility. |
| Framing | All three use the `input` reference. A sphere resting on a hemisphere is the closest existing construction. |

## Decisions

- **The head rests on the shoulders; it doesn't float like the icon's detached head.** Detached heads worked for one user and for the pair. In the trio, the gap under the front head showed the rear users' shoulders as a false neck. Spacing the trio wider left the front head in line with the back row, so it read as a back-row head. Contact also matches the illustration language: Input's sphere rests in its bowl.
- **Opaque rather than translucent.** With the 35% hidden-line pass, every figure showed its rear base rim and the contours behind each head. That made the groups busy. Switching back is one line per recipe.

## Checks

- **Runner:** eight views per illustration. Every line is 1.28, there are no hidden-line runs, and everything stays inside the export bounds.
- **Recipe assertions:**
  - Each head is a true sphere touching the apex.
  - The dome axes are 70 / 70 / 60 and orthogonal.
  - Each figure has one stroke (its base rim) and one base disk.
  - There is one Iris head, and it belongs to the nearest user.
  - No two solids are closer than 160.
  - The pair is point-symmetric.
  - The trio is equally spaced on one circle, with its centroid at the origin, and is mirror-symmetric.
- **Visual review:** all orientations are coherent, overlaps meet in clean T-junctions, and there are no slivers or duplicate strokes.

## Known limitations of the shared renderer

1. **The figures sit high in the frame.** The shared fit (`fit` in `src/scripts/illustration-3d/models.ts`) bounds each hemisphere by its full ellipsoid. That includes the mirrored half, which doesn't exist, so upward domes get extra space below them.

   | | Clear space top / bottom (384 export) |
   | --- | --- |
   | One user | 64.6 / 103.8 |
   | Two users | 73.0 / 100.8 |
   | Three users | 86.2 / 109.7 |
   | Input, for comparison | 64.6 / 64.6 |

   A read-only simulation tested a fix: skip that absent half, since a solid hemisphere's mesh faces already bound it. With the fix, all three are exactly centred, Input is unchanged and Focus moves 0.5 units to exact centre. One user also grows ×1.18, because its height is no longer inflated. Re-run the recipes after any fix.
2. **The Iris shows through in the underside view.** Iris fills are not depth-tested, so where the shoulders cover the head from below, the head's fill shows through them. Always on bleeds the same way in its underside view. The neutral exports are not affected.

## Re-render

From the repository root:

```sh
node skills/atomsai-illustrations/scripts/render.mjs --recipe "$PWD/illustration-proposals/recipes/one-user.mjs" --out /tmp/one-user --repo "$PWD"
```

With the rebuilt kit, all three recipes render with `--repo`, and their output is byte-identical to the files in `svg/`.

## Gallery

| Where | What |
| --- | --- |
| `src/scripts/illustration-3d/models.ts` | A `user()` helper and the `one-user`, `two-users` and `three-users` cases. They hold the same geometry as the recipes, and each head is a named part. |
| `src/scripts/illustration-3d/data/reference-metrics.json` | Input's `frame` and `bounds`, copied unchanged, so the framing matches the reviewed exports. `sourceHash` is the SHA-256 of each master. |
| `src/assets/brand/illustration/<slug>.svg` | Masters: the neutral export, with `currentColor` ink and a viewBox cropped to the 201-unit frame (`64 64 256 256`). The static preview therefore matches the live canvas size. |
| `src/pages/illustration.astro` | The last row of 7.2 Linework, at Input's 201 px art width. The Linework copy now lists the user figures with the other opaque examples. |
| `src/scripts/illustration-3d/motion.ts` | Loops: a head lifts by the icon's clearance (30), holds, and settles. One user takes 5 s. Two users take 6 s, nearest first. Three users take 6 s: only the two rear users nod, left then right, because a lifted front head would open a gap showing their shoulders as a false neck. |
| `scripts/check-illustrations.mjs` | A user block checks proportions, head contact, ground plane, base disks, 160 spacing and the nearest-user Iris. It also checks that the loops lift heads straight up by no more than the clearance while shoulders stay planted. |

In the browser, each card's export is byte-identical to the matching file in `svg/`.
