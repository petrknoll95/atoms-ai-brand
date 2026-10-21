// Point-pattern statistics for checking the dot field against the Figma frames (dev only).
//
// Both point sets are first thinned to the same count, so sampling noise doesn't favour the
// denser one, and only dots on screen and within `radius` of the centre are counted.
//
// - ringScore: how periodic the radial density is. The density per radius band (corrected for the
//   part of each circle that falls off screen) is divided by its own moving average, and the score
//   is the spread of that ratio. Concentric rings score high; a nebula should score as low as
//   frame 01.
// - clarkEvans: the Clark–Evans aggregation index, mean nearest-neighbour distance over the
//   distance expected for a random (Poisson) pattern of the same density. 1 is random, below 1
//   is clumped.
// - dispersion: variance over mean of dot counts in 24 px cells. 1 is random, higher is clumpier.
//   The dense core dominates it, so `outerDispersion` repeats it beyond 150 px (clumps in the
//   field) and `coreShare` is the share of dots within 100 px (how concentrated the core is).
// - tangential: how much local filaments run around the centre (concentric or spiral arcs) rather
//   than in any direction. Each dot's filament direction is the principal axis of its 8 nearest
//   neighbours; the score is the nematic order cos(2Δ) against the tangent, averaged over dots on
//   clear filaments. 0 is no preference, 1 is perfectly concentric.

export interface PointStats {
  count: number;
  ringScore: number;
  clarkEvans: number;
  dispersion: number;
  outerDispersion: number;
  coreShare: number;
  tangential: number;
}

interface Frame {
  cx: number;
  cy: number;
  width: number;
  height: number;
  /** Only dots within this distance of the centre count. */
  radius?: number;
  /** Thin both sets to this many dots. */
  sample?: number;
}

const round = (v: number) => Math.round(v * 1000) / 1000;

export function pointStats(points: number[], { cx, cy, width, height, radius = 650, sample = 2000 }: Frame): PointStats {
  const inside = (x: number, y: number) => x >= 0 && x <= width && y >= 0 && y <= height && Math.hypot(x - cx, y - cy) < radius;
  const all: [number, number][] = [];
  for (let i = 0; i < points.length; i += 2) if (inside(points[i], points[i + 1])) all.push([points[i], points[i + 1]]);
  const step = Math.max(1, all.length / sample);
  const pts: [number, number][] = [];
  for (let i = 0; i < all.length; i += step) pts.push(all[Math.floor(i)]);
  const n = pts.length;

  // Ring score.
  const bin = 4, rMin = 60, rMax = radius;
  const bins = Math.floor((rMax - rMin) / bin);
  const counts = new Float64Array(bins);
  for (const [x, y] of pts) {
    const b = Math.floor((Math.hypot(x - cx, y - cy) - rMin) / bin);
    if (b >= 0 && b < bins) counts[b]++;
  }
  const density: (number | null)[] = [];
  for (let b = 0; b < bins; b++) {
    const r = rMin + (b + 0.5) * bin;
    let on = 0;
    for (let k = 0; k < 180; k++) {
      const a = (k / 180) * Math.PI * 2;
      if (inside(cx + Math.cos(a) * r, cy + Math.sin(a) * r)) on++;
    }
    const coverage = on / 180;
    density.push(coverage > 0.15 ? counts[b] / (coverage * 2 * Math.PI * r * bin) : null);
  }
  const ratios: number[] = [];
  for (let b = 0; b < bins; b++) {
    const d = density[b];
    if (d === null) continue;
    let sum = 0, m = 0;
    for (let j = b - 7; j <= b + 7; j++) {
      const v = density[j];
      if (v != null) {
        sum += v;
        m++;
      }
    }
    if (sum > 0) ratios.push(d / (sum / m));
  }
  const mean = ratios.reduce((s, v) => s + v, 0) / ratios.length;
  const ringScore = Math.sqrt(ratios.reduce((s, v) => s + (v - mean) ** 2, 0) / ratios.length);

  // Area of the counted region, on a 4 px grid.
  let cells = 0;
  for (let x = 2; x < width; x += 4) for (let y = 2; y < height; y += 4) if (inside(x, y)) cells++;
  const area = cells * 16;

  // Clark–Evans, with a grid for the nearest-neighbour search.
  const size = 32;
  const grid = new Map<string, [number, number][]>();
  for (const p of pts) {
    const key = `${Math.floor(p[0] / size)},${Math.floor(p[1] / size)}`;
    (grid.get(key) ?? grid.set(key, []).get(key)!).push(p);
  }
  /** The k nearest neighbours of (x, y), as [distance, point] pairs. */
  const nearest = (x: number, y: number, k: number) => {
    const gx = Math.floor(x / size), gy = Math.floor(y / size);
    let found: [number, [number, number]][] = [];
    for (let ring = 1; ring < 20; ring++) {
      found = [];
      for (let i = gx - ring; i <= gx + ring; i++) {
        for (let j = gy - ring; j <= gy + ring; j++) {
          for (const q of grid.get(`${i},${j}`) ?? []) {
            if (q[0] !== x || q[1] !== y) found.push([Math.hypot(q[0] - x, q[1] - y), q]);
          }
        }
      }
      found.sort((a, b) => a[0] - b[0]);
      // Everything within (ring - 1) cells is certain to have been searched.
      if (found.length >= k && found[k - 1][0] <= (ring - 1) * size) break;
    }
    return found.slice(0, k);
  };

  let nnSum = 0;
  let order = 0, oriented = 0;
  for (const [x, y] of pts) {
    const near = nearest(x, y, 8);
    nnSum += near[0]?.[0] ?? 0;
    let sxx = 0, syy = 0, sxy = 0;
    for (const [, q] of near) {
      const dx = q[0] - x, dy = q[1] - y;
      sxx += dx * dx;
      syy += dy * dy;
      sxy += dx * dy;
    }
    const trace = sxx + syy;
    const anisotropy = trace > 0 ? Math.sqrt((sxx - syy) ** 2 + 4 * sxy * sxy) / trace : 0;
    if (anisotropy < 0.5 || Math.hypot(x - cx, y - cy) < 40) continue;
    const axis = 0.5 * Math.atan2(2 * sxy, sxx - syy);
    const tangent = Math.atan2(y - cy, x - cx) + Math.PI / 2;
    order += Math.cos(2 * (axis - tangent));
    oriented++;
  }
  const clarkEvans = nnSum / n / (0.5 / Math.sqrt(n / area));
  const tangential = oriented ? order / oriented : 0;

  // Index of dispersion over 24 px cells, from `minRadius` out.
  const dispersionFrom = (minRadius: number) => {
    const cell = 24;
    const tally = new Map<string, number>();
    for (let x = cell / 2; x < width; x += cell) {
      for (let y = cell / 2; y < height; y += cell) {
        if (inside(x, y) && Math.hypot(x - cx, y - cy) >= minRadius) tally.set(`${Math.floor(x / cell)},${Math.floor(y / cell)}`, 0);
      }
    }
    for (const [x, y] of pts) {
      const key = `${Math.floor(x / cell)},${Math.floor(y / cell)}`;
      if (tally.has(key)) tally.set(key, tally.get(key)! + 1);
    }
    const values = [...tally.values()];
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    return values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length / mean;
  };
  const coreShare = pts.filter(([x, y]) => Math.hypot(x - cx, y - cy) < 100).length / n;

  return {
    count: n,
    ringScore: round(ringScore),
    clarkEvans: round(clarkEvans),
    dispersion: round(dispersionFrom(0)),
    outerDispersion: round(dispersionFrom(150)),
    coreShare: round(coreShare),
    tangential: round(tangential),
  };
}
