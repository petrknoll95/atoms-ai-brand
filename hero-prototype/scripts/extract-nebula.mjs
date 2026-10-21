// Extracts the nebula point cloud from Figma frame 01 into src/data/nebula-01.json.
//
// Source: the dot vector of frame 01 (node 127:4887) in the "AtomsAI — Website" Figma file
// (pLyUMYhdCUYzwz0UXPtGY8), exported as SVG. It is one path of circles, each written as
// "M x0 y C ... cx ytop ...Z" starting at the circle's left point.
//
// Usage: node scripts/extract-nebula.mjs <frame-01-dots.svg>
//
// Each point is stored relative to the rings' centre (1045, 439 in the 1600 × 900 frame), with the
// direction of its local filament and how strongly it lies on one (anisotropy 0–1), from a PCA of
// its nearest neighbours. The hero resamples along those directions to build its nebula.

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const svgPath = process.argv[2];
if (!svgPath) {
  console.error('Usage: node scripts/extract-nebula.mjs <frame-01-dots.svg>');
  process.exit(1);
}

/** Where the vector sits in the frame (Figma: x 47, y −500). */
const VECTOR_OFFSET = { x: 47, y: -500 };
const CENTRE = { x: 1045, y: 439 };
const NEIGHBOURS = 10;

const d = readFileSync(svgPath, 'utf8').match(/ d="([^"]+)"/)?.[1];
if (!d) throw new Error('No path data found');

const points = [];
for (const sub of d.split('Z')) {
  const m = sub.trim().match(/^M([-\d.]+) ([-\d.]+)C[-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+ ([-\d.]+) ([-\d.]+)/);
  if (!m) continue;
  const [, , y, cx] = m.map(Number);
  points.push({ x: cx + VECTOR_OFFSET.x - CENTRE.x, y: y + VECTOR_OFFSET.y - CENTRE.y });
}

// Local filament direction: principal axis of the offsets to the nearest neighbours.
const out = [];
for (const p of points) {
  const near = points
    .map((q) => ({ q, d: (q.x - p.x) ** 2 + (q.y - p.y) ** 2 }))
    .sort((a, b) => a.d - b.d)
    .slice(1, NEIGHBOURS + 1);
  let sxx = 0, syy = 0, sxy = 0;
  for (const { q } of near) {
    const dx = q.x - p.x, dy = q.y - p.y;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const trace = sxx + syy;
  const spread = Math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy);
  const anisotropy = trace > 0 ? spread / trace : 0;
  out.push(+p.x.toFixed(1), +p.y.toFixed(1), +angle.toFixed(2), +anisotropy.toFixed(2));
}

const target = fileURLToPath(new URL('../src/data/nebula-01.json', import.meta.url));
writeFileSync(
  target,
  JSON.stringify({
    source: 'Figma pLyUMYhdCUYzwz0UXPtGY8, node 127:4887 (Concept A, frame 01 dots)',
    centre: [CENTRE.x, CENTRE.y],
    stride: 4,
    fields: ['x', 'y', 'angle', 'anisotropy'],
    points: out,
  }),
);
console.log(`Wrote ${points.length} points to ${target}`);
