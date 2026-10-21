// Hero dot field: one p5 canvas of several thousand dots, driven by scrolling the hero's track.
//
// 1. On load the dots fade in as a chaotic nebula (Figma frame 01). It is resampled from frame 01's
//    own dot coordinates (src/data/nebula-01.json) along their local filaments, plus extra clumps
//    in random orientations so nothing lines up around the centre.
//    The cloud is 3D (dots sit off the disc plane, coherently by clump) and tumbles slowly.
//    The first part of the scroll turns it into concentric rings around a dense core (frame 02),
//    the way debris settles into orbits. Each nebula dot is paired with a ring dot by optimal
//    transport in polar coordinates: radius rank first, then angle within each ring. Then, in
//    three acts that overlap dot by dot:
//    - Infall: the cloud collapses toward the core while it spins up. Differential rotation (inner
//      rings wind further) shears clumps into spiral arms.
//    - The swing: the field tilts away (with a little yaw), flattening into a disc seen at an
//      angle, then comes back face-on as the arms tighten.
//    - Lock-in: each dot spreads out to its ring with an overshoot and pulses as it locks, inner
//      rings first, so the pulse ripples outward.
//    Turbulence peaks mid-way, timing varies smoothly across the cloud so clumps move as units, and
//    moving dots are drawn as motion-blur streaks. It is a pure function of the playhead, so it
//    scrubs both ways. The playhead follows the scroll with a speed cap, so a fast flick still
//    plays the transition over a few seconds.
// 2. The rest of the scroll flies the camera into the core. Every dot has a depth (outer rings near,
//    the core far), so the rings stream outward past the camera with parallax. The hero copy fades
//    out over the first part of the dive.
// 3. The camera ends on the single dot at the very centre of the core. It grows by the same
//    perspective as every other dot, but sits on the axis, so it fills the screen while its
//    neighbours stream outward. It is the mask of the next section (a clip-path circle on that
//    section, in the dots' colour), whose content fades in as it fills. Header items switch to
//    their dark tone as the circle passes under them.
//
// Positions are in design px: the 1600 × 900 Figma frame, measured from the field's centre. They
// are scaled to the viewport by its diagonal, so the rings keep the same framing at any size.
// Colour follows the Figma fill: a radial gradient from foreground at the centre to background at
// the fade radius, so dots dissolve into the page as they move outward.

import p5 from 'p5';
import frame01 from '../data/nebula-01.json';

const DESIGN = { width: 1600, height: 900 };
const DESIGN_DIAGONAL = Math.hypot(DESIGN.width, DESIGN.height);
const TAU = Math.PI * 2;

export const CONFIG = {
  seed: 4127,
  colors: { foreground: '#27433b', background: '#f6f1e8' },
  /** Centre of the rings as a fraction of the stage (frame 02: 1045, 439). */
  centre: { x: 1045 / 1600, y: 439 / 900 },
  /** Below this stage width the field centres horizontally behind the stacked copy. */
  narrow: { maxWidth: 900, centre: { x: 0.5, y: 0.3 } },
  /** Radius of the colour gradient, design px. Dots at or past it are background-coloured. */
  fadeRadius: 998,

  // ----- Settled rings (frame 02) -----
  /** Ring radii in design px, measured from frame 02. `fill` thins a ring (222 is a partial ring). */
  rings: [
    { r: 122, fill: 1 },
    { r: 180, fill: 1.15 },
    { r: 222, fill: 0.3 },
    { r: 273, fill: 1 },
    { r: 355, fill: 1 },
    { r: 450, fill: 1 },
    { r: 561, fill: 1 },
    { r: 686, fill: 1 },
    { r: 828, fill: 1 },
    { r: 988, fill: 1 },
  ],
  /** Slots along each ring are this far apart (design px); dropout leaves 2–4 dot groups. */
  slotSpacing: 4,
  /**
   * Kept dots per design px of circumference: base + perRadius / r (inner rings run denser).
   * Frame 02 is about 0.05 + 6 / r; this runs about twice as dense, with smaller dots.
   */
  density: { base: 0.1, perRadius: 12 },
  /** Radial bend of each ring (noise amplitude, design px) and the Gaussian thickness of its band. */
  bend: 40,
  thickness: 4,
  /**
   * Core: an even disc with a soft edge, a sparse halo and a tight seed at the very centre. `peers`
   * sit right beside the centre dot at its depth, so on the way in they grow with it: a peer d px
   * from the centre stays d / dot radius of its radii away, and leaves the screen as it fills.
   */
  core: {
    disc: 580,
    discRadius: 60,
    halo: 140,
    haloSigma: 48,
    maxRadius: 104,
    seed: 70,
    seedSigma: 6,
    peers: { count: 10, minRadius: 2.8, maxRadius: 10 },
  },
  /**
   * Off-screen rings that give the nebula's outer dots somewhere to go. They sit past the fade
   * radius once settled, so those dots drift outward and dissolve as the rings form.
   */
  outerRings: [1120, 1260, 1400],
  /** Dot radius, CSS px (Figma: 1.4 in the nebula, 1.59 in the rings). */
  dotRadius: { nebula: 1.05, rings: 1.15 },

  // ----- Nebula (frame 01) -----
  nebula: {
    /** Share of dots resampled from frame 01's points; the rest form extra clumps. */
    frame01Share: 0.58,
    /**
     * Resampling jitter (design px): along the point's local filament (scaled by how
     * filament-like it is there) and across it.
     */
    along: 5,
    across: 1.4,
    /**
     * Extra clumps, a Thomas cluster process: parents spread by radius like frame 01 (even count per
     * radius, so denser inward), each a Gaussian blob stretched along a random direction and
     * slightly curved.
     */
    clumps: {
      dots: [16, 90] as [number, number],
      sigma: [3, 13] as [number, number],
      stretch: [1, 3.5] as [number, number],
      curve: 0.025,
      radius: [90, 1080] as [number, number],
    },
    /**
     * Share of dots in clumps right at the centre, so the core is as concentrated as frame 01's
     * (about 29% of on-screen dots within 100 px) but lumpy rather than a smooth blob.
     */
    coreClumps: { share: 0.05, radius: 70, sigma: [4, 12] as [number, number] },
    /** Slow differential rotation while the nebula waits (rad/s at the centre). */
    drift: 0.05,
    /** Idle shimmer while waiting: noise displacement (design px) and how fast it evolves. */
    shimmer: { amplitude: 3, rate: 0.12 },
    /**
     * The nebula is a 3D cloud. Each dot sits off the disc plane by amount × its radius × a smooth
     * noise over the cloud (so clumps keep together in depth), plus jitter (design px).
     */
    depth: { amount: 0.55, scale: 300, jitter: 14 },
    /** While it waits, the cloud tumbles slowly so its depth reads (rad, and rad/s). */
    tumble: { yaw: 0.16, pitch: 0.07, rate: 0.21 },
  },
  /** Seconds for the nebula to fade in on load. */
  fadeIn: 0.7,

  // ----- Scroll -----
  scroll: {
    /** The nebula has become rings by this much of the track; the dive takes the rest. */
    organizeEnd: 0.42,
    /**
     * The sequence follows a playhead, not the raw scroll position: a critically damped spring
     * toward it (stiffness, 1/s²), with speed capped so each phase takes at least this many seconds
     * however fast the page is scrolled, and acceleration capped so it eases into that speed.
     */
    stiffness: 26,
    minSeconds: { organize: 3.6, dive: 2.4 },
    /** Seconds to reach the capped speed. */
    rampSeconds: 0.45,
  },

  // ----- Organise: nebula to rings, over the first part of the scroll -----
  organize: {
    /**
     * Each dot moves over `duration` of the phase. Inner rings start first (`radialDelay`), then a
     * smooth noise over the nebula (`clumpDelay`) so neighbouring dots, and so whole clumps, set off
     * together. Delays and duration add up to 1 so every dot lands by the phase's end.
     */
    duration: 0.68,
    radialDelay: 0.18,
    clumpDelay: 0.14,
    /** Scale (design px) of the timing noise: about the size of a clump. */
    clumpScale: 260,
    /**
     * Differential rotation: a ring at radius r winds amount × (450 / r) ^ power radians on the way
     * in (Keplerian shear is power 1.5), up to maxWind. Inner rings turn further, so clumps spanning
     * several rings shear into spiral arms.
     */
    wind: { amount: 1.15, power: 1, maxWind: 6.6 },
    /**
     * Act 1, infall: over the first part of its move each dot's radius pulls in to `amount` of
     * itself, so the cloud collapses toward the core as it spins up.
     */
    infall: { amount: 0.5, end: 0.4 },
    /**
     * Act 2, the swing: the whole field tilts away about its horizontal axis (and yaws a little)
     * while the disc forms, then comes back face-on: sin(π × progress through `range`) × the
     * maximum, in rad. `focal` is the perspective of that view (design px).
     */
    swing: { tilt: 0.95, yaw: 0.32, range: [0.03, 0.9] as [number, number], focal: 1500 },
    /** Dots flatten from the cloud into the disc over this first part of their move. */
    flatten: 0.72,
    /**
     * Act 3, lock-in: from `spreadStart` of its move a dot's radius spreads out to its ring,
     * anticipating and overshooting (easeInOutBack strength). As it locks it pulses: bigger and
     * darker over `at` of its move. Inner rings lock first, so the pulse ripples outward.
     */
    spreadStart: 0.3,
    overshoot: 0.9,
    lockPulse: { size: 0.9, shade: 0.45, at: [0.8, 1] as [number, number] },
    /** Moving dots draw slightly darker, by this much at the middle of their move. */
    transitShade: 0.3,
    /** Dots slide along their ring into their exact slot over this last part of their move. */
    slotSlide: [0.6, 1] as [number, number],
    /** Turbulence: noise displacement (design px) peaking mid-move, its scale, and how much it evolves. */
    turbulence: { amplitude: 30, scale: 150, evolve: 2.6 },
    /**
     * Motion blur: moving dots are drawn as streaks covering this many seconds of their motion
     * (about a 180° shutter at 60 fps; longer smears the swirl into hair).
     */
    shutter: 0.012,
  },
  /** Idle rotation of the settled rings, rad/s (alternating direction ring to ring). */
  idleSpin: 0.014,

  // ----- Dive -----
  dive: {
    /**
     * Depth: outer ring at 1, inner rings further, by (988 / r) ^ depthPower. 0 is a flat zoom,
     * 1 a tunnel of equal rings; in between gives parallax without emptying the view too soon.
     */
    depthPower: 0.6,
    /** The colour falloff widens as the camera closes in (× 1 + fadeGrow at the end). */
    fadeGrow: 1.4,
    depthJitter: 0.03,
    coreDepthJitter: 0.12,
    /**
     * The camera zooms on the centre dot, smoothly in log-magnification: log k = log kEnd ×
     * progress ^ ease, where kEnd is the magnification at which that dot covers the stage. A higher
     * ease spends longer among the rings and saves the steep part for the end.
     */
    ease: 2.5,
    /** Roll of the whole field over the dive (rad). */
    roll: 0.45,
    /**
     * Every dot, the centre one included, is drawn at radius × k ^ sizePower, where k is its own
     * on-screen magnification. 1 is true perspective: dots at the centre dot's depth grow exactly
     * as it does. Below 1 the centre dot must be magnified far more to fill the screen, so its
     * peers are long gone and it ends up alone among smaller, deeper dots.
     */
    sizePower: 1,
    /**
     * Core dots within this distance of the centre (design px) sit well behind the centre dot
     * (12–40% deeper), so nothing is in the camera's path and they read as small, far dots. The
     * only dots that keep pace with the centre one are its `core.peers`.
     */
    axisClear: 15,
  },

  // ----- Reveal: into the centre dot -----
  reveal: {
    /** The next section's content fades in as the centre dot's radius goes over this share of the stage. */
    contentFade: [0.3, 1] as [number, number],
    /** Under reduced motion the next section crossfades in over this part of the dive instead. */
    crossfade: [0.7, 1] as [number, number],
  },
  /** The copy is gone by this much of the dive. */
  copyFadeEnd: 0.2,
  copyLift: 24,
  /** Colour steps for batching dots into a few fills. */
  shades: 48,
};

interface Mount {
  /** The scroll track: its scroll range drives the organise and the dive. */
  track: HTMLElement;
  /** Holds the canvas. */
  stage: HTMLElement;
  /** Fades out over the first part of the dive. */
  content: HTMLElement;
  /** The next section: clipped to the centre dot, so it shows through as the dot grows. */
  next: HTMLElement;
  /**
   * The fixed site header. Its backdrop follows the same dot through `--reveal-x / -y / -r`; each
   * `[data-tone-target]` switches to `data-tone="dark"` once the dot covers it.
   */
  header: HTMLElement | null;
}

/** A view of the field: tilt about its horizontal axis and yaw about its vertical one. */
interface View {
  active: boolean;
  cosT: number;
  sinT: number;
  cosY: number;
  sinY: number;
}

/** A dot's placement: position (design px from the centre), perspective scale, own progress. */
interface Spot {
  x: number;
  y: number;
  s: number;
  e: number;
}

interface Field {
  count: number;
  /** Settled polar position (design px, rad). */
  ringRadius: Float32Array;
  ringAngle: Float32Array;
  /** Nebula polar position. */
  nebulaRadius: Float32Array;
  nebulaAngle: Float32Array;
  /** How far the dot sits off the disc plane in the nebula (design px); 0 once settled. */
  thickness: Float32Array;
  /** Differential rotation on the way in (rad), shared by a ring's dots. */
  wind: Float32Array;
  /** The final slide along the ring into the dot's slot: ring angle − (nebula angle + wind). */
  turn: Float32Array;
  /** Idle spin of the dot's ring, rad/s. */
  spin: Float32Array;
  /** When the dot starts moving, as a fraction of the organise phase. */
  delay: Float32Array;
  /** Depth: 1 = the outer ring. */
  depth: Float32Array;
  /** Depth of the centre dot the dive ends in (the middle of the core). */
  targetDepth: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smoothstep = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
/** Eases in and out, backing off a little at the start and overshooting a little at the end. */
const easeInOutBack = (t: number, strength: number) => {
  const c = strength * 1.525;
  return t < 0.5
    ? ((2 * t) ** 2 * ((c + 1) * 2 * t - c)) / 2
    : ((2 * t - 2) ** 2 * ((c + 1) * (2 * t - 2) + c) + 2) / 2;
};
const wrapAngle = (a: number) => a - TAU * Math.round(a / TAU);
const positiveAngle = (a: number) => ((a % TAU) + TAU) % TAU;

/** Where the field's centre sits on a w × h stage, and the design-px-to-screen scale. */
const layout = (w: number, h: number) => {
  const centre = w < CONFIG.narrow.maxWidth ? CONFIG.narrow.centre : CONFIG.centre;
  return { cx: w * centre.x, cy: h * centre.y, scale: Math.hypot(w, h) / DESIGN_DIAGONAL };
};
/** The turbulence grid, in design px around the centre: half the noise's feature size per cell. */
const FLOW = (() => {
  const cell = 75, halfWidth = 1275, halfHeight = 825;
  return { cell, halfWidth, halfHeight, cols: (2 * halfWidth) / cell + 1, rows: (2 * halfHeight) / cell + 1 };
})();
const depthAt = (r: number) => (CONFIG.rings[CONFIG.rings.length - 1].r / Math.max(r, 60)) ** CONFIG.dive.depthPower;

/** The nebula: `n` points, frame 01's dots resampled along their filaments plus extra clumps. */
function nebulaPoints(p: p5, n: number) {
  const neb = CONFIG.nebula;
  const { points, stride } = frame01;
  const out: { x: number; y: number }[] = [];

  const fromFrame = Math.round(n * neb.frame01Share);
  for (let k = 0; k < fromFrame; k++) {
    const j = Math.floor(p.random(points.length / stride)) * stride;
    const [x, y, angle, anisotropy] = [points[j], points[j + 1], points[j + 2], points[j + 3]];
    const along = p.randomGaussian(0, neb.across + neb.along * anisotropy);
    const across = p.randomGaussian(0, neb.across);
    out.push({
      x: x + Math.cos(angle) * along - Math.sin(angle) * across,
      y: y + Math.sin(angle) * along + Math.cos(angle) * across,
    });
  }

  const c = neb.clumps;
  /** Adds clumps until there are `until` points, with parents at a radius drawn from `radius`. */
  const addClumps = (until: number, radius: () => number, sigmaRange: [number, number]) => {
    while (out.length < until) {
      const r = radius();
      const a = p.random(TAU);
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      const size = Math.round(p.random(c.dots[0], c.dots[1]));
      const sigma = p.random(sigmaRange[0], sigmaRange[1]);
      const stretch = p.random(c.stretch[0], c.stretch[1]);
      const dir = p.random(TAU);
      const bend = p.random(-c.curve, c.curve);
      for (let k = 0; k < size && out.length < until; k++) {
        const u = p.randomGaussian(0, sigma * stretch);
        const v = p.randomGaussian(0, sigma) + bend * u * u;
        out.push({ x: px + Math.cos(dir) * u - Math.sin(dir) * v, y: py + Math.sin(dir) * u + Math.cos(dir) * v });
      }
    }
  };
  const centre = neb.coreClumps;
  addClumps(out.length + Math.round(n * centre.share), () => centre.radius * Math.sqrt(p.random()), centre.sigma);
  addClumps(n, () => p.random(c.radius[0], c.radius[1]), c.sigma);
  return out;
}

function build(p: p5): Field {
  p.randomSeed(CONFIG.seed);
  p.noiseSeed(CONFIG.seed);
  p.noiseDetail(2, 0.5);
  const organize = CONFIG.organize;

  // ----- Settled targets: ring slots kept after dropout, then the core. `group` ties dots that are
  // matched together by angle: one ring, or one radius band of the core.
  interface Target {
    a: number;
    r: number;
    z: number;
    spin: number;
    group: number;
  }
  const targets: Target[] = [];
  const allRings = [...CONFIG.rings, ...CONFIG.outerRings.map((r) => ({ r, fill: 1 }))];
  allRings.forEach((ring, i) => {
    const slots = Math.round((TAU * ring.r) / CONFIG.slotSpacing);
    const keep = (CONFIG.density.base + CONFIG.density.perRadius / ring.r) * CONFIG.slotSpacing * ring.fill;
    const phase = p.random(TAU);
    const spinRate = (i % 2 ? 1 : -1) * CONFIG.idleSpin * (0.7 + 0.6 * p.random());
    const z = depthAt(ring.r);
    for (let k = 0; k < slots; k++) {
      const a = phase + (k / slots) * TAU;
      const cx = Math.cos(a), cy = Math.sin(a);
      // Density drifts along the ring, so some arcs are fuller than others.
      const along = 0.7 + 0.6 * p.noise(cx * 1.4 + i * 11.1, cy * 1.4, 7.7);
      if (p.random() > keep * along) continue;
      const bend = (p.noise(cx * 3 + i * 5.3, cy * 3 + 3.1, 1.3) - 0.5) * 2 * CONFIG.bend;
      targets.push({
        a,
        r: ring.r + bend + p.randomGaussian(0, CONFIG.thickness),
        z: z * (1 + p.randomGaussian(0, CONFIG.dive.depthJitter)),
        spin: spinRate,
        group: i,
      });
    }
  });

  // Core, at the far end of the dive, around the centre dot (at coreDepth). Dots close to the axis
  // sit well behind it, apart from its few peers at the same depth.
  const core = CONFIG.core;
  const coreDepth = depthAt(core.discRadius);
  const coreSpin = CONFIG.idleSpin * 1.6;
  const addCore = (count: number, radius: () => number) => {
    for (let k = 0; k < count; k++) {
      let r;
      do r = Math.abs(radius());
      while (r > core.maxRadius);
      const z =
        r < CONFIG.dive.axisClear
          ? coreDepth * (1.12 + p.random(0.28))
          : coreDepth * (1 + Math.max(-0.3, Math.min(0.3, p.randomGaussian(0, CONFIG.dive.coreDepthJitter))));
      targets.push({ a: p.random(TAU), r, z, spin: coreSpin, group: -1 });
    }
  };
  addCore(core.disc, () => core.discRadius * Math.sqrt(p.random()) + p.randomGaussian(0, 6));
  addCore(core.halo, () => Math.hypot(p.randomGaussian(0, core.haloSigma), p.randomGaussian(0, core.haloSigma)));
  addCore(core.seed, () => Math.hypot(p.randomGaussian(0, core.seedSigma), p.randomGaussian(0, core.seedSigma)));

  // Peers: at the centre dot's depth, spaced so no two (or a peer and the centre dot) overlap as
  // they grow together.
  const peers = core.peers;
  const placed: { x: number; y: number }[] = [{ x: 0, y: 0 }];
  const clearance = CONFIG.dotRadius.rings * 2.4;
  for (let tries = 0; placed.length <= peers.count && tries < 500; tries++) {
    const a = p.random(TAU);
    const r = p.random(peers.minRadius, peers.maxRadius);
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (placed.some((q) => Math.hypot(q.x - x, q.y - y) < clearance)) continue;
    placed.push({ x, y });
    // Even 1% deeper would leave a peer at half the centre dot's size by the end, so keep them close.
    targets.push({ a, r, z: coreDepth * (1 + p.random(0.003)), spin: coreSpin, group: -1 });
  }

  // The core is matched in radius bands of about 120 dots, like thin rings.
  targets
    .filter((t) => t.group < 0)
    .sort((a, b) => a.r - b.r)
    .forEach((t, k) => (t.group = allRings.length + Math.floor(k / 120)));

  const count = targets.length;
  const sources = nebulaPoints(p, count);
  const sourceRadius = sources.map((s) => Math.hypot(s.x, s.y));
  const sourceAngle = sources.map((s) => Math.atan2(s.y, s.x));

  // ----- Matching: optimal transport in polar coordinates. Radius first (1D, so pairing by rank
  // is optimal): the k-th closest nebula dot goes to the k-th closest slot, which decides each
  // dot's ring. Then angle within each ring (1D on a circle): nebula dots in order of where the
  // winding brings them, slots in order, paired with the cyclic shift that moves them least.
  const byTargetRadius = targets.map((_, i) => i).sort((i, j) => targets[i].r - targets[j].r);
  const bySourceRadius = sources.map((_, i) => i).sort((i, j) => sourceRadius[i] - sourceRadius[j]);
  const groups = new Map<number, { t: number[]; s: number[] }>();
  byTargetRadius.forEach((ti, k) => {
    const g = targets[ti].group;
    const entry = groups.get(g) ?? groups.set(g, { t: [], s: [] }).get(g)!;
    entry.t.push(ti);
    entry.s.push(bySourceRadius[k]);
  });

  const { wind: windConfig } = organize;
  const source = new Int32Array(count);
  const wind = new Float32Array(count);
  for (const { t, s } of groups.values()) {
    const meanRadius = t.reduce((sum, i) => sum + targets[i].r, 0) / t.length;
    const w = Math.min(windConfig.maxWind, windConfig.amount * (450 / Math.max(meanRadius, 40)) ** windConfig.power);
    const arrivals = s.map((i) => ({ i, a: positiveAngle(sourceAngle[i] + w) })).sort((a, b) => a.a - b.a);
    const slots = t.map((i) => ({ i, a: positiveAngle(targets[i].a) })).sort((a, b) => a.a - b.a);
    const n = t.length;
    let best = 0, bestCost = Infinity;
    for (let shift = 0; shift < n; shift++) {
      let cost = 0;
      for (let j = 0; j < n && cost < bestCost; j++) cost += wrapAngle(slots[(j + shift) % n].a - arrivals[j].a) ** 2;
      if (cost < bestCost) {
        bestCost = cost;
        best = shift;
      }
    }
    for (let j = 0; j < n; j++) {
      const ti = slots[(j + best) % n].i;
      source[ti] = arrivals[j].i;
      wind[ti] = w;
    }
  }

  // ----- Per dot: where it starts, the slide into its slot, and when it sets off. The timing
  // noise is sampled where the dot starts, so a clump sets off together.
  const lastRing = CONFIG.rings[CONFIG.rings.length - 1].r;
  const turn = new Float32Array(count);
  const delay = new Float32Array(count);
  const nebulaRadius = new Float32Array(count);
  const nebulaAngle = new Float32Array(count);
  const thickness = new Float32Array(count);
  const { depth: cloud } = CONFIG.nebula;
  for (let i = 0; i < count; i++) {
    const s = source[i];
    nebulaRadius[i] = sourceRadius[s];
    nebulaAngle[i] = sourceAngle[s];
    const coherent = (p.noise(sources[s].x / cloud.scale + 50, sources[s].y / cloud.scale + 80) - 0.5) * 4;
    thickness[i] = cloud.amount * sourceRadius[s] * coherent + p.randomGaussian(0, cloud.jitter);
    turn[i] = wrapAngle(targets[i].a - (sourceAngle[s] + wind[i]));
    const clump = clamp01((p.noise(sources[s].x / organize.clumpScale + 300, sources[s].y / organize.clumpScale + 300) - 0.25) / 0.5);
    delay[i] = organize.radialDelay * Math.min(1, targets[i].r / lastRing) + organize.clumpDelay * clump;
  }

  return {
    count,
    ringRadius: Float32Array.from(targets, (t) => t.r),
    ringAngle: Float32Array.from(targets, (t) => t.a),
    nebulaRadius,
    nebulaAngle,
    thickness,
    wind,
    turn,
    spin: Float32Array.from(targets, (t) => t.spin),
    delay,
    depth: Float32Array.from(targets, (t) => t.z),
    targetDepth: coreDepth,
  };
}

/** The fill for each shade step, from background (0) to foreground (shades - 1). */
function shadeFills(steps: number) {
  const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const bg = hex(CONFIG.colors.background);
  const fg = hex(CONFIG.colors.foreground);
  return Array.from({ length: steps }, (_, s) => {
    const t = s / (steps - 1);
    const c = bg.map((b, i) => Math.round(b + (fg[i] - b) * t));
    return `rgb(${c[0]} ${c[1]} ${c[2]})`;
  });
}

export function mountHeroField({ track, stage, content, next, header }: Mount) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fills = shadeFills(CONFIG.shades);
  /** Header items with their centres, in viewport px (the header is fixed). */
  let toneTargets: { el: HTMLElement; x: number; y: number }[] = [];
  const measureToneTargets = () => {
    toneTargets = [...(header?.querySelectorAll<HTMLElement>('[data-tone-target]') ?? [])].map((el) => {
      const r = el.getBoundingClientRect();
      return { el, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  };
  measureToneTargets();
  document.fonts.ready.then(measureToneTargets);

  let field: Field | null = null;
  /** Seconds since the field mounted: drives the fade-in, the nebula drift and the ring spin. */
  let clock = 0;
  let start = 0;
  let progress = 0;
  /** Where the sequence is (track progress 0–1), and how fast it moves (per second). */
  let playhead = 0;
  let velocity = 0;
  let lastFrame = performance.now();
  /** Dev only: pins the clock (s) so a state can be inspected, and reads back dot positions. */
  let pinnedClock: number | null = null;
  let capture: ((points: number[]) => void) | null = null;

  /** Scroll progress through the track: 0 at the top of the page, 1 when the stage unpins. */
  const readProgress = () => {
    const rect = track.getBoundingClientRect();
    const range = rect.height - window.innerHeight;
    return range > 0 ? clamp01(-rect.top / range) : 0;
  };

  /** Splits track progress into the organise phase and the dive, each 0–1. */
  const phases = (t: number) => {
    const end = CONFIG.scroll.organizeEnd;
    return { organize: clamp01(t / end), dive: clamp01((t - end) / (1 - end)) };
  };

  /**
   * Moves the playhead toward the scroll position: a critically damped spring, with its speed
   * capped per phase (blended across the boundary) and its acceleration capped so it ramps up.
   * Past the end of the track, or under reduced motion, it follows the scroll directly.
   */
  const advance = (dt: number, still: boolean) => {
    const { organizeEnd: end, stiffness, minSeconds, rampSeconds } = CONFIG.scroll;
    const pastTrack = track.getBoundingClientRect().bottom < window.innerHeight - 1;
    if (still || pastTrack) {
      playhead = progress;
      velocity = 0;
      return;
    }
    const mix = smoothstep(end - 0.03, end + 0.03, playhead);
    const cap = (end / minSeconds.organize) * (1 - mix) + ((1 - end) / minSeconds.dive) * mix;
    const pull = stiffness * (progress - playhead) - 2 * Math.sqrt(stiffness) * velocity;
    const maxAccel = cap / rampSeconds;
    velocity += Math.max(-maxAccel, Math.min(maxAccel, pull)) * dt;
    velocity = Math.max(-cap, Math.min(cap, velocity));
    playhead = clamp01(playhead + velocity * dt);
    if (Math.abs(progress - playhead) < 1e-4 && Math.abs(velocity) < 1e-3) {
      playhead = progress;
      velocity = 0;
    }
  };

  const applyCopy = (dive: number) => {
    const fade = smoothstep(0, CONFIG.copyFadeEnd, dive);
    content.style.opacity = String(1 - fade);
    content.style.transform = fade > 0 ? `translate3d(0, ${(-CONFIG.copyLift * fade).toFixed(2)}px, 0)` : '';
    content.toggleAttribute('data-hidden', fade >= 1);
  };

  /** Scratch for the per-dot placement: the current view and position, and the blur's. */
  const viewNow: View = { active: false, cosT: 1, sinT: 0, cosY: 1, sinY: 0 };
  const viewLag: View = { active: false, cosT: 1, sinT: 0, cosY: 1, sinY: 0 };
  const here: Spot = { x: 0, y: 0, s: 1, e: 0 };
  const then: Spot = { x: 0, y: 0, s: 1, e: 0 };
  const flowX = new Float32Array(FLOW.cols * FLOW.rows);
  const flowY = new Float32Array(FLOW.cols * FLOW.rows);

  let lastClip = '';
  let lastOpacity = '';
  let lastContent = '';
  let lastHeaderDot = '';
  /**
   * Clips the next section to the centre dot (and turns the header's backdrop green inside it),
   * fades the section's content in, and flips header items to their dark tone once the dot covers
   * them. Under reduced motion `crossfade` (0–1) fades the section in unmasked instead.
   */
  const applyReveal = (
    x: number,
    y: number,
    radius: number,
    cover: number,
    contentIn: number,
    crossfade: number | null = null,
  ) => {
    const clip =
      crossfade !== null || radius >= cover
        ? 'none'
        : `circle(${Math.max(0, radius).toFixed(2)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
    if (clip !== lastClip) {
      next.style.clipPath = clip;
      lastClip = clip;
    }
    const alpha = crossfade !== null && crossfade < 1 ? crossfade.toFixed(3) : '';
    if (alpha !== lastOpacity) {
      next.style.opacity = alpha;
      lastOpacity = alpha;
    }
    const headerRadius = crossfade !== null ? (crossfade > 0.5 ? cover : 0) : Math.min(Math.max(0, radius), cover);
    const headerDot = `${x.toFixed(1)} ${y.toFixed(1)} ${headerRadius.toFixed(2)}`;
    if (header && headerDot !== lastHeaderDot) {
      header.style.setProperty('--reveal-x', `${x.toFixed(1)}px`);
      header.style.setProperty('--reveal-y', `${y.toFixed(1)}px`);
      header.style.setProperty('--reveal-r', `${headerRadius.toFixed(2)}px`);
      lastHeaderDot = headerDot;
    }
    const contentValue = contentIn.toFixed(3);
    if (contentValue !== lastContent) {
      next.style.setProperty('--reveal', contentValue);
      lastContent = contentValue;
    }
    for (const t of toneTargets) {
      const dark = crossfade !== null ? crossfade > 0.5 : Math.hypot(t.x - x, t.y - y) < radius;
      if (dark !== (t.el.dataset.tone === 'dark')) {
        if (dark) t.el.dataset.tone = 'dark';
        else delete t.el.dataset.tone;
      }
    }
  };

  const instance = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(stage.clientWidth, stage.clientHeight);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      field = build(p);
      progress = playhead = readProgress();
      applyCopy(phases(playhead).dive);
      start = p.millis();
    };

    p.windowResized = () => {
      p.resizeCanvas(stage.clientWidth, stage.clientHeight);
      measureToneTargets();
    };

    p.draw = () => {
      if (!field) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - lastFrame) / 1000);
      lastFrame = now;
      const still = reducedMotion.matches;
      clock = pinnedClock ?? (p.millis() - start) / 1000;

      // Scroll moves the target; the sequence follows the playhead.
      progress = readProgress();
      advance(dt, still);
      const phase = phases(playhead);
      applyCopy(phase.dive);

      const w = p.width;
      const h = p.height;
      const { cx, cy, scale } = layout(w, h);

      // Camera: one zoom on the centre dot, smooth in log-magnification, ending where that dot
      // covers the stage. Every dot (the centre one too) is k ^ sizePower times its resting size at
      // its own magnification k, so the centre dot grows exactly like its neighbours; it only fills
      // the screen because it sits on the axis while they stream outward past the edges. Under
      // reduced motion the rings are already formed, there is no dive, and the field fades as the
      // next section crossfades in.
      const f = field;
      const dive = CONFIG.dive;
      const reveal = CONFIG.reveal;
      const target = f.targetDepth;
      const targetDot = CONFIG.dotRadius.rings;
      const cover = Math.hypot(Math.max(cx, w - cx), Math.max(cy, h - cy)) + 2;
      const kEnd = (cover / targetDot) ** (1 / dive.sizePower);
      const zoom = still ? 0 : phase.dive ** dive.ease;
      const targetK = kEnd ** zoom;
      const camera = target * (1 - 1 / targetK);
      const dotRadius = phase.dive > 0 ? targetDot * targetK ** dive.sizePower : 0;
      if (still) {
        const crossfade = smoothstep(reveal.crossfade[0], reveal.crossfade[1], phase.dive);
        applyReveal(cx, cy, 0, cover, crossfade, crossfade);
      } else {
        applyReveal(cx, cy, dotRadius, cover, smoothstep(reveal.contentFade[0], reveal.contentFade[1], dotRadius / cover));
      }

      const travel = still ? 0 : smoothstep(0, 0.8, phase.dive);
      const fadeRadius = CONFIG.fadeRadius * scale * (1 + dive.fadeGrow * travel);
      const roll = travel * dive.roll;
      const cosR = Math.cos(roll), sinR = Math.sin(roll);
      const stillFade = still ? 1 - smoothstep(0, 0.4, phase.dive) : 1;

      const organize = CONFIG.organize;
      const { turbulence, swing, infall, lockPulse } = organize;
      const neb = CONFIG.nebula;
      const fadeIn = still ? 1 : clamp01(clock / CONFIG.fadeIn);
      const spinTime = still ? 0 : clock;

      // Turbulence and shimmer act until every dot has settled. Their flow field is sampled on a
      // coarse grid once per frame (Perlin noise per dot was most of the frame time); it evolves
      // with the scroll through the organise phase and, slowly, with time.
      const stirring = !still && phase.organize < 1;
      if (stirring) {
        const t = phase.organize * turbulence.evolve + clock * neb.shimmer.rate;
        for (let row = 0, k = 0; row < FLOW.rows; row++) {
          const v = (row * FLOW.cell - FLOW.halfHeight) / turbulence.scale;
          for (let col = 0; col < FLOW.cols; col++, k++) {
            const u = (col * FLOW.cell - FLOW.halfWidth) / turbulence.scale;
            // Two octaves of Perlin noise sit mostly within 0.25–0.75, so ×4 maps them to about ±1.
            flowX[k] = (p.noise(u + 7.3, v, t) - 0.5) * 4;
            flowY[k] = (p.noise(u, v + 3.7, t + 19) - 0.5) * 4;
          }
        }
      }

      /**
       * The view of the field at organise progress o: the swing (tilt away and back, with a little
       * yaw) while the disc forms, plus the slow tumble while the nebula waits.
       */
      const view = (o: number, out: View) => {
        const swung = still ? 0 : Math.sin(Math.PI * smoothstep(swing.range[0], swing.range[1], o));
        const idle = still ? 0 : 1 - smoothstep(0, 0.12, o);
        const tilt = swing.tilt * swung + neb.tumble.pitch * Math.sin(clock * neb.tumble.rate * 0.7 + 1) * idle;
        const yaw = swing.yaw * swung + neb.tumble.yaw * Math.sin(clock * neb.tumble.rate) * idle;
        out.active = Math.abs(tilt) > 1e-5 || Math.abs(yaw) > 1e-5;
        out.cosT = Math.cos(tilt);
        out.sinT = Math.sin(tilt);
        out.cosY = Math.cos(yaw);
        out.sinY = Math.sin(yaw);
      };

      /**
       * Where dot i is at organise progress o, seen through view v (design px from the centre),
       * with its perspective scale and its own progress e. Its path:
       * - winds round the centre (inner rings further), the nebula's idle drift handing over to
       *   the ring's idle spin;
       * - falls in toward the core, then spreads out to its ring with anticipation and overshoot,
       *   sliding into its exact slot at the end;
       * - is stirred by turbulence that peaks mid-way (and a faint shimmer while waiting);
       * - flattens from the 3D cloud into the disc, which the view tilts and turns. Perspective
       *   applies only to the change from face-on, so the waiting nebula matches frame 01.
       */
      const place = (i: number, o: number, v: View, out: Spot) => {
        const e = still ? 1 : clamp01((o - f.delay[i]) / organize.duration);
        const wound = smootherstep(e);
        const angle =
          f.nebulaAngle[i] +
          neb.drift * (1 - Math.min(1, f.nebulaRadius[i] / 1400)) * spinTime * (1 - wound) +
          (f.wind[i] + f.spin[i] * spinTime) * wound +
          f.turn[i] * smoothstep(organize.slotSlide[0], organize.slotSlide[1], e);
        const fallen = f.nebulaRadius[i] * (1 - (1 - infall.amount) * smoothstep(0, infall.end, e));
        const radius =
          fallen + (f.ringRadius[i] - fallen) * easeInOutBack(smoothstep(organize.spreadStart, 1, e), organize.overshoot);
        let x = Math.cos(angle) * radius;
        let y = Math.sin(angle) * radius;
        const stir = stirring ? turbulence.amplitude * Math.sin(Math.PI * e) ** 2 + neb.shimmer.amplitude * (1 - e) : 0;
        if (stir > 0.25) {
          // Bilinear lookup in this frame's flow grid.
          const gx = Math.min(FLOW.cols - 1.001, Math.max(0, (x + FLOW.halfWidth) / FLOW.cell));
          const gy = Math.min(FLOW.rows - 1.001, Math.max(0, (y + FLOW.halfHeight) / FLOW.cell));
          const ix = gx | 0, iy = gy | 0;
          const fx = gx - ix, fy = gy - iy;
          const k = iy * FLOW.cols + ix;
          const k2 = k + FLOW.cols;
          x += stir * ((flowX[k] * (1 - fx) + flowX[k + 1] * fx) * (1 - fy) + (flowX[k2] * (1 - fx) + flowX[k2 + 1] * fx) * fy);
          y += stir * ((flowY[k] * (1 - fx) + flowY[k + 1] * fx) * (1 - fy) + (flowY[k2] * (1 - fx) + flowY[k2 + 1] * fx) * fy);
        }
        let s = 1;
        if (v.active) {
          const off = f.thickness[i] * (1 - smoothstep(0, organize.flatten, e));
          const x1 = x * v.cosY + off * v.sinY;
          const d1 = -x * v.sinY + off * v.cosY;
          const y2 = y * v.cosT - d1 * v.sinT;
          const d2 = y * v.sinT + d1 * v.cosT;
          s = swing.focal / Math.max(swing.focal * 0.2, swing.focal + d2 - off);
          x = x1 * s;
          y = y2 * s;
        }
        out.x = x;
        out.y = y;
        out.s = s;
        out.e = e;
      };

      view(phase.organize, viewNow);
      // Motion blur: where the playhead was `shutter` seconds ago, in organise progress.
      const lagOrganize = clamp01(phase.organize - (velocity / CONFIG.scroll.organizeEnd) * organize.shutter);
      const blurring = stirring && Math.abs(phase.organize - lagOrganize) > 1e-4;
      if (blurring) view(lagOrganize, viewLag);

      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.clearRect(0, 0, w, h);
      const dots = Array.from({ length: CONFIG.shades }, () => new Path2D());
      const streaks = Array.from({ length: CONFIG.shades }, () => new Path2D());
      const usedDots = new Uint8Array(CONFIG.shades);
      const usedStreaks = new Uint8Array(CONFIG.shades);
      const captured: number[] | null = capture ? [] : null;

      // Once the dot covers the stage there is nothing left to draw.
      const count = !still && dotRadius >= cover ? 0 : f.count;
      for (let i = 0; i < count; i++) {
        place(i, phase.organize, viewNow, here);
        const e = here.e;

        // Camera: magnification k grows as the camera closes on the dot's depth.
        const z = f.depth[i];
        const gap = z - camera;
        if (gap <= 1e-6) continue;
        const k = z / gap;
        const m = scale * k;
        const sx = cx + (here.x * cosR - here.y * sinR) * m;
        const sy = cy + (here.x * sinR + here.y * cosR) * m;

        const distance = Math.hypot(sx - cx, sy - cy);
        if (distance >= fadeRadius) continue;
        const lock = e > lockPulse.at[0] && e < 1 ? Math.sin(Math.PI * ((e - lockPulse.at[0]) / (lockPulse.at[1] - lockPulse.at[0]))) : 0;
        const energy = 1 + organize.transitShade * Math.sin(Math.PI * e) + lockPulse.shade * lock;
        const shade = Math.min(1, (1 - distance / fadeRadius) * energy) * fadeIn * stillFade;
        if (shade < 0.02) continue;

        const dot =
          (CONFIG.dotRadius.nebula + (CONFIG.dotRadius.rings - CONFIG.dotRadius.nebula) * e) *
          k ** dive.sizePower *
          here.s *
          (1 + lockPulse.size * lock);
        if (sx < -dot || sy < -dot || sx > w + dot || sy > h + dot) continue;

        const s = Math.round(shade * (CONFIG.shades - 1));
        if (blurring) {
          place(i, lagOrganize, viewLag, then);
          const lx = cx + (then.x * cosR - then.y * sinR) * m;
          const ly = cy + (then.x * sinR + then.y * cosR) * m;
          if (Math.abs(lx - sx) + Math.abs(ly - sy) > 1.2) {
            streaks[s].moveTo(lx, ly);
            streaks[s].lineTo(sx, sy);
            usedStreaks[s] = 1;
          }
        }
        dots[s].moveTo(sx + dot, sy);
        dots[s].arc(sx, sy, dot, 0, TAU);
        usedDots[s] = 1;
        captured?.push(sx, sy);
      }
      if (capture && captured) {
        capture(captured);
        capture = null;
      }

      ctx.lineCap = 'round';
      ctx.lineWidth = CONFIG.dotRadius.rings * 1.6;
      for (let s = 1; s < CONFIG.shades; s++) {
        if (usedStreaks[s]) {
          ctx.strokeStyle = fills[s];
          ctx.stroke(streaks[s]);
        }
        if (usedDots[s]) {
          ctx.fillStyle = fills[s];
          ctx.fill(dots[s]);
        }
      }
    };
  }, stage);

  // Only animate while the hero is on screen.
  const visibility = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) instance.loop();
    else instance.noLoop();
  });
  visibility.observe(track);

  const points = async () => {
    let captured: number[] = [];
    capture = (p) => (captured = p);
    await instance.redraw();
    return captured;
  };

  if (import.meta.env.DEV) {
    (window as unknown as { heroField: object }).heroField = {
      pin: (seconds: number | null) => {
        pinnedClock = seconds;
        instance.redraw();
      },
      /** Draws a frame now and returns the screen x, y pairs of its dots. */
      points,
      /** Jumps the playhead to track progress t (or to the scroll position), skipping the speed cap. */
      seek: async (t?: number) => {
        progress = readProgress();
        playhead = t ?? progress;
        velocity = 0;
        return points();
      },
      /** The playhead and its speed, to check the speed cap. */
      playhead: () => ({ playhead, velocity, progress }),
      /**
       * Draws `frames` frames as if `1 / fps` seconds passed before each, and returns the playhead
       * after each one: a frame-rate-independent check of the speed cap.
       */
      simulate: async (frames: number, fps = 60) => {
        const trace: number[] = [];
        for (let i = 0; i < frames; i++) {
          lastFrame = performance.now() - 1000 / fps;
          await instance.redraw();
          trace.push(playhead);
        }
        return trace;
      },
      /** Point-pattern statistics of the current frame and of Figma frame 01's dots, on this stage. */
      stats: async () => {
        const [{ pointStats }, { default: frame01 }] = await Promise.all([
          import('./point-stats'),
          import('../data/nebula-01.json'),
        ]);
        const width = stage.clientWidth, height = stage.clientHeight;
        const { cx, cy, scale } = layout(width, height);
        const reference: number[] = [];
        for (let i = 0; i < frame01.points.length; i += frame01.stride) {
          reference.push(cx + frame01.points[i] * scale, cy + frame01.points[i + 1] * scale);
        }
        const frame = { cx, cy, width, height };
        return { field: pointStats(await points(), frame), frame01: pointStats(reference, frame) };
      },
    };
  }

  return instance;
}
