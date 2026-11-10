import { add, sub, mul, dot, cross, unit, type PartInfo, type Scene, type V } from './geometry';
import { sceneExtent, viewTransform, type View } from './render';
import { ease } from '../../data/slitLogo';

/**
 * Gallery motion loops. Each loop moves named parts of the example's own 3D model, so every
 * frame is projected and depth-tested exactly like the still: shared camera, one stroke
 * weight, one 35% hidden-line pass and the same Iris fades. Time t runs 0–1 per loop and
 * t = 0 is the approved still. Parts a loop does not mention stay at rest.
 */

/** p ↦ L·p + t, with the linear part L stored as rows. */
type Affine = { L: [V, V, V]; t: V };
/** One placement of a part. A part given a list is drawn once per entry; [] hides it. */
type Pose = { m?: Affine; dashPhase?: number };
type Motion = Record<string, Pose | Pose[]>;
type Parts = Record<string, PartInfo>;
type Loop = { seconds: number; motion: (t: number, parts: Parts) => Motion };

const TAU = Math.PI * 2;
const ORIGIN: V = [0, 0, 0], Y: V = [0, 1, 0];
const IDENTITY: [V, V, V] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const linear = (L: [V, V, V], v: V): V => [dot(L[0], v), dot(L[1], v), dot(L[2], v)];
const apply = (m: Affine, p: V): V => add(linear(m.L, p), m.t);
const transpose = (L: [V, V, V]): [V, V, V] => [[L[0][0], L[1][0], L[2][0]], [L[0][1], L[1][1], L[2][1]], [L[0][2], L[1][2], L[2][2]]];
const product = (A: [V, V, V], B: [V, V, V]): [V, V, V] => { const C = transpose(B); return A.map(row => C.map(column => dot(row, column))) as [V, V, V]; };
const about = (L: [V, V, V], pivot: V): Affine => ({ L, t: sub(pivot, linear(L, pivot)) });
const translate = (t: V): Affine => ({ L: IDENTITY, t });
/** Right-handed rotation about an axis through a pivot. */
function rotation(axis: V, angle: number, pivot: V = ORIGIN): Affine {
    const [x, y, z] = unit(axis), c = Math.cos(angle), s = Math.sin(angle), k = 1 - c;
    return about([[c + x * x * k, x * y * k - z * s, x * z * k + y * s], [y * x * k + z * s, c + y * y * k, y * z * k - x * s], [z * x * k - y * s, z * y * k + x * s, c + z * z * k]], pivot);
}
const scaling = (factor: number, pivot: V): Affine => about([[factor, 0, 0], [0, factor, 0], [0, 0, factor]], pivot);
/** Scale along one direction only, e.g. a bar's height or an arrow's length. */
function stretch(direction: V, factor: number, pivot: V): Affine {
    const d = unit(direction), k = factor - 1;
    return about(d.map((a, i) => d.map((b, j) => (i === j ? 1 : 0) + k * a * b)) as [V, V, V], pivot);
}
const compose = (a: Affine, b: Affine): Affine => ({ L: product(a.L, b.L), t: add(linear(a.L, b.t), a.t) });
const mix = (a: V, b: V, f: number): V => add(a, mul(sub(b, a), f));

/** Move once between two moments, with the mark's cubic-bezier(0.7, 0, 0.3, 1); exact at rest. */
const move = (t: number, start: number, end: number) => {
    const x = (t - start) / (end - start);
    return x <= 0 ? 0 : x >= 1 ? 1 : ease(x);
};
/** A single soft pulse, 0 outside 0–1. */
const swell = (x: number) => (x <= 0 || x >= 1 ? 0 : Math.sin(Math.PI * x) ** 2);
/** A gentler sine ease, for long travel such as a full lap. */
const glide = (t: number, start: number, end: number) => {
    const x = (t - start) / (end - start);
    return x <= 0 ? 0 : x >= 1 ? 1 : .5 - .5 * Math.cos(Math.PI * x);
};
/** Out, hold, back, hold: two brand-eased moves in one loop. */
const pulse = (t: number, out: number, held: number, back: number, home: number) => move(t, out, held) - move(t, back, home);
const info = <T>(parts: Parts, name: string) => parts[name] as unknown as T;

const loops: Record<string, Loop> = {
    // Workflows sweep through every system in turn, each passing down through the shared
    // handoff point a beat after the last.
    'full-visibility': {
        seconds: 7,
        motion: (t, parts) => Object.fromEntries([0, 1, 2, 3].map(i => {
            const { center, axis, side } = info<{ center: V; axis: V; side: number }>(parts, `node-${i}`);
            return [`node-${i}`, { m: rotation(axis, -side * TAU * glide(t, .04 + .05 * i, .79 + .05 * i), center) }];
        })),
    },
    // The agent's Iris tile works its way around the top of the stack, one quadrant at a time.
    'built-in-your-stack': {
        seconds: 6,
        motion: (t, parts) => {
            const { size } = info<{ size: number }>(parts, 'tile');
            const route: V[] = [[0, 0, 0], [0, 0, size], [-size, 0, size], [-size, 0, 0]];
            const quarter = Math.floor(t * 4) % 4;
            return { tile: { m: translate(mix(route[quarter], route[(quarter + 1) % 4], move(t * 4 - Math.floor(t * 4), .35, .95))) } };
        },
    },
    // A growth pulse passes from the smallest circle to the largest, every circle keeping the
    // shared tangent point; the arrow extends with the outermost circle.
    'compounding-outcomes': {
        seconds: 5,
        motion: (t, parts) => {
            const growth = (i: number) => 1 + .15 * swell((t - .06 - (4 - i) * .1) / .4);
            const pose: Motion = {};
            for (let i = 0; i < 5; i++) pose[`ring-${i}`] = { m: scaling(growth(i), info<{ tangent: V }>(parts, `ring-${i}`).tangent) };
            const { start, tip, tangent } = info<{ start: V; tip: V; tangent: V }>(parts, 'arrow');
            const reach = add(tangent, mul(sub(tip, tangent), growth(0)));
            pose.arrow = { m: stretch(sub(tip, start), Math.hypot(...sub(reach, start)) / Math.hypot(...sub(tip, start)), start) };
            pose['arrow-head'] = { m: translate(sub(reach, tip)) };
            return pose;
        },
    },
    // The five sheets spring apart around the Iris sheet, hold, and close up again.
    stack: {
        seconds: 5,
        motion: (t, parts) => {
            const open = .42 * pulse(t, .04, .36, .56, .9);
            return Object.fromEntries(Object.keys(parts).map(name => [name, { m: translate([0, info<{ y: number }>(parts, name).y * open, 0]) }]));
        },
    },
    // The sphere drops into the bowl, passing behind its near wall, and lifts out again.
    input: {
        seconds: 5,
        motion: (t, parts) => {
            const { axis, radius } = info<{ axis: V; radius: number }>(parts, 'ball');
            return { ball: { m: translate(mul(axis, -.8 * radius * pulse(t, .08, .38, .56, .88))) } };
        },
    },
    // The two orbits rock open and closed like scissors about the diameter they share, so they
    // keep crossing at the same two points.
    orbit: {
        seconds: 5,
        motion: (t, parts) => {
            const [a, b] = [0, 1].map(i => info<{ normal: V }>(parts, `hoop-${i}`).normal);
            const hinge = cross(a, b), angle = .32 * Math.sin(TAU * t);
            return { 'hoop-0': { m: rotation(hinge, angle) }, 'hoop-1': { m: rotation(hinge, -angle) } };
        },
    },
    // The column ticks downward one ring at a time: a ring peels away from the top disc and the
    // lowest settles into the bottom disc.
    'stack-2': {
        seconds: 2.4,
        motion: (t, parts) => {
            const { step } = info<{ step: V }>(parts, 'ring-1'), drop = move(t, .1, .7);
            // Ring 1 ends inside the bottom disc; a copy of ring 4 starts inside the top disc.
            const fall = { m: translate(mul(step, -drop)) };
            return { 'ring-1': fall, 'ring-2': fall, 'ring-3': fall, 'ring-4': [fall, { m: translate(mul(step, 1 - drop)) }] };
        },
    },
    // The spheres drop toward the bowl's focus one step at a time. The deepest dissolves into it
    // as a new one forms at the top.
    focus: {
        seconds: 4,
        motion: (t, parts) => {
            const balls = [0, 1, 2].map(i => info<{ offset: number; radius: number; axis: V; depth: number }>(parts, `ball-${i}`));
            const { axis, depth } = balls[0];
            const stops = [...balls, { offset: -.78 * depth, radius: 0 }];
            const at = (slot: number) => {
                if (slot <= 0) return { offset: stops[0].offset, radius: stops[0].radius * Math.max(0, slot + 1) };
                const i = Math.min(2, Math.floor(slot)), f = slot - i;
                return { offset: stops[i].offset + (stops[i + 1].offset - stops[i].offset) * f, radius: stops[i].radius + (stops[i + 1].radius - stops[i].radius) * f };
            };
            // Ball k moves from its own slot to the next; a copy of the top ball forms in place.
            const place = (k: number, slot: number): Pose[] => {
                const from = balls[k], to = at(slot);
                if (to.radius <= .02 * from.radius) return [];
                return [{ m: compose(translate(mul(axis, to.offset - from.offset)), scaling(to.radius / from.radius, mul(axis, from.offset))) }];
            };
            const step = move(t, .2, .75);
            return { 'ball-0': [...place(0, step), ...place(0, step - 1)], 'ball-1': place(1, 1 + step), 'ball-2': place(2, 2 + step) };
        },
    },
    // The Iris module flips a third of a turn about its own diagonal and locks back into place.
    modular: {
        seconds: 4,
        motion: (t, parts) => {
            const { axis, center } = info<{ axis: V; center: V }>(parts, 'module');
            return { module: { m: rotation(axis, TAU / 3 * move(t, .2, .72), center) } };
        },
    },
    // A steady wave runs down the tiers and never stops. Each tier lags the one above; all pass
    // their rest height together at t = 0.
    'always-on': {
        seconds: 2.5,
        motion: t => Object.fromEntries([0, 1, 2, 3].map(i => {
            const lag = (3 - i) * .16;
            return [`tier-${i}`, { m: translate([0, 11 * (Math.sin(TAU * (t - lag)) + Math.sin(TAU * lag)), 0]) }];
        })),
    },
    // The bars shoot up from their bases in turn, each further than the last, building toward
    // the Iris bar.
    momentum: {
        seconds: 4.5,
        motion: t => Object.fromEntries([0, 1, 2, 3, 4].map(i =>
            [`bar-${i}`, { m: stretch(Y, 1 + (.08 + .035 * i) * swell((t - .08 - .09 * i) / .38), ORIGIN) }])),
    },
    // The outer sheets slide out in opposite directions, shearing the stack, hold, and realign.
    layers: {
        seconds: 5,
        motion: t => { const x = 30 * pulse(t, .04, .34, .54, .86); return { 'sheet-0': { m: translate([-x, 0, 0]) }, 'sheet-2': { m: translate([x, 0, 0]) } }; },
    },
    // The dashed outlines of the other states run around their sheets in opposite directions.
    states: {
        seconds: 4,
        motion: t => ({ 'sheet-0': { dashPhase: 6 * t }, 'sheet-2': { dashPhase: -6 * t } }),
    },
    // A riffle passes through the pages, each kicking toward the next in turn.
    unfolding: {
        seconds: 4.5,
        motion: (t, parts) => Object.fromEntries([0, 1, 2, 3, 4, 5, 6, 7].map(i => {
            const { hinge, axis } = info<{ hinge: V; axis: V }>(parts, `page-${i}`);
            return [`page-${i}`, { m: rotation(axis, Math.PI / 8 * .7 * swell((t - .05 - .065 * i) / .3), hinge) }];
        })),
    },
    // The Iris core spins steadily inside its still frame, a quarter turn per loop.
    nested: {
        seconds: 3.5,
        motion: t => ({ inner: { m: rotation(Y, Math.PI / 2 * t) } }),
    },
    // The filter sweeps up and down past the nearest points; points it passes dim behind it.
    filtering: {
        seconds: 6,
        motion: t => ({ filter: { m: translate([0, 52 * Math.sin(TAU * t), 0]) } }),
    },
    // Both ray fans snap in toward the axis, pulling focus, hold, and open again.
    precision: {
        seconds: 4,
        motion: (t, parts) => {
            const { center, spread } = info<{ center: V; spread: V }>(parts, 'rays');
            return { rays: { m: stretch(spread, 1 - .5 * pulse(t, .05, .38, .56, .9), center) } };
        },
    },
    // The arrows reach outward one after another, circling the cube clockwise from the top.
    versatility: {
        seconds: 5,
        motion: (t, parts) => Object.fromEntries([0, 1, 4, 6, 5, 3, 2].map((i, rank) => {
            const { start, end } = info<{ start: V; end: V }>(parts, `arrow-${i}`);
            const length = Math.hypot(...sub(end, start));
            return [`arrow-${i}`, { m: stretch(sub(end, start), 1 + 13 / length * swell((t - .06 - .09 * rank) / .28), start) }];
        })),
    },
    // The user lifts its head to the icon's head clearance, holds, and settles back onto its shoulders.
    'one-user': { seconds: 5, motion: (t, parts) => nods(t, parts, ['head-0']) },
    // The two users nod in turn, nearest first.
    'two-users': { seconds: 6, motion: (t, parts) => nods(t, parts, ['head-0', 'head-1']) },
    // The two users behind nod in turn, left then right, around the steady Iris user. A lifted front
    // head would open a gap that shows their shoulders behind it as a false neck.
    'three-users': { seconds: 6, motion: (t, parts) => nods(t, parts, ['head-2', 'head-1']) },
};

/** The named heads lift in turn by the icon's head clearance, hold and settle, each within its share of the loop. */
function nods(t: number, parts: Parts, heads: string[]): Motion {
    return Object.fromEntries(heads.map((name, k) => {
        const { lift } = info<{ lift: number }>(parts, name), start = (k + .1) / heads.length, span = .8 / heads.length;
        return [name, { m: translate([0, lift * pulse(t, start, start + .3 * span, start + .55 * span, start + .85 * span), 0]) }];
    }));
}

export const loopSeconds = (slug: string) => loops[slug]?.seconds;

type Fitted = { m: Affine; normals: [V, V, V]; dashPhase?: number; identity: boolean };
const isIdentity = (m: Affine) => m.L.every((row, i) => row.every((value, j) => value === (i === j ? 1 : 0))) && m.t.every(value => value === 0);
/** Directions spread evenly over the sphere, for extreme points of a part. */
const DIRECTIONS: V[] = Array.from({ length: 256 }, (_, i) => {
    const y = 1 - (2 * i + 1) / 256, r = Math.sqrt(1 - y * y), a = i * Math.PI * (3 - Math.sqrt(5));
    return [r * Math.cos(a), y, r * Math.sin(a)];
});
/** The few points of a part that are furthest out in some direction: its approximate hull. */
function extremes(points: V[]): V[] {
    const unique = [...new Map(points.map(p => [p.map(v => v.toFixed(4)).join(','), p])).values()];
    const hull = new Set<V>();
    for (const d of DIRECTIONS) {
        let best = unique[0], reach = -Infinity;
        for (const p of unique) { const value = dot(p, d); if (value > reach) { reach = value; best = p; } }
        hull.add(best);
    }
    return [...hull];
}
/** Inverse-transpose, so surface normals stay perpendicular under stretches. */
function normalMatrix(L: [V, V, V]): [V, V, V] {
    const [[a, b, c], [d, e, f], [g, h, i]] = L;
    const cofactor: [V, V, V] = [[e * i - f * h, f * g - d * i, d * h - e * g], [c * h - b * i, a * i - c * g, b * g - a * h], [b * f - c * e, c * d - a * f, a * e - b * d]];
    return cofactor;
}

export type Animator = {
    seconds: number;
    /** The fitted model at loop time t (0–1); t = 0 is the still. */
    scene(t: number): Scene;
    /** Rotation fit covering every frame of the loop at this view. */
    extent(view: Pick<View, 'yaw' | 'pitch'>): number;
};

/** Build frames of a loop from a fitted rest scene, reusing every element that does not move. */
export function createAnimator(slug: string, rest: Scene): Animator | undefined {
    const loop = loops[slug];
    if (!loop || !rest.parts || !rest.fitted) return undefined;
    const parts = rest.parts, { origin, scale } = rest.fitted;
    // Model-space motion → fitted space: fitted = (pose · model − origin) × scale.
    const P = rest.pose ? transpose(rest.pose) : IDENTITY, Pt = transpose(P);
    const fitted = (pose: Pose): Fitted => {
        const m = pose.m ?? translate(ORIGIN);
        const L = product(product(P, m.L), Pt);
        const t = mul(sub(add(linear(L, origin), linear(P, m.t)), origin), scale);
        // An exact rest pose reuses the element itself, so t = 0 reproduces the still exactly.
        return { m: { L, t }, normals: normalMatrix(L), dashPhase: pose.dashPhase, identity: isIdentity(m) };
    };
    const posesAt = (t: number) => {
        const poses = new Map<string, Fitted[]>();
        for (const [name, value] of Object.entries(loop.motion(t, parts))) poses.set(name, (Array.isArray(value) ? value : [value]).map(fitted));
        return poses;
    };
    const point = (f: Fitted, p: V) => (f.identity ? p : apply(f.m, p));
    const normal = (f: Fitted, n: V) => (f.identity ? n : unit(linear(f.normals, n)));
    // Copies after the first get their own owner, so their silhouettes never skip each other.
    const owner = (id: number | undefined, copy: number) => (id === undefined || copy === 0 ? id : id + copy * 1e6);

    // While a loop holds still, return the same frame object so nothing is re-projected or repainted.
    let lastKey = '', lastScene: Scene | undefined;
    function scene(t: number): Scene {
        const poses = posesAt(t);
        let key = '';
        poses.forEach((list, name) => { key += `${name}:${list.map(f => [...f.m.L.flat(), ...f.m.t, f.dashPhase ?? ''].map(v => typeof v === 'number' ? v.toFixed(5) : v).join(',')).join(';')}|`; });
        if (key === lastKey && lastScene) return lastScene;
        lastKey = key;
        const placed =<T extends { part?: string }>(items: T[], move: (item: T, pose: Fitted, copy: number) => T) => {
            const out: T[] = [];
            for (const item of items) {
                const list = item.part === undefined ? undefined : poses.get(item.part);
                if (!list) out.push(item);
                else list.forEach((pose, copy) => out.push(pose.identity && copy === 0 && pose.dashPhase === undefined ? item : move(item, pose, copy)));
            }
            return out;
        };
        return lastScene = {
            ...rest,
            lines: placed(rest.lines, (l, f, copy) => ({ ...l, points: l.points.map(p => point(f, p)), normals: l.normals?.map(n => normal(f, n)), owner: owner(l.owner, copy), dashPhase: f.dashPhase ?? l.dashPhase })),
            faces: placed(rest.faces, (face, f, copy) => ({ ...face, points: face.points.map(p => point(f, p)), hole: face.hole?.map(p => point(f, p)), owner: owner(face.owner, copy) })),
            highlights: placed(rest.highlights, (h, f) => ({ ...h, points: h.points.map(p => point(f, p)), hole: h.hole?.map(p => point(f, p)), normal: h.normal && normal(f, h.normal), gradient: h.gradient.map(p => point(f, p)), mesh: h.mesh?.map(face => face.map(p => point(f, p))) })),
            contours: placed(rest.contours, (c, f, copy) => ({ ...c, center: point(f, c.center), axes: c.axes.map(a => linear(f.m.L, a)) as [V, V, V], owner: owner(c.owner, copy)! })),
            cylinders: placed(rest.cylinders, (c, f, copy) => ({ ...c, top: point(f, c.top), axis: linear(f.m.L, c.axis), u: linear(f.m.L, c.u), v: linear(f.m.L, c.v), owner: owner(c.owner, copy)! })),
            arrows: placed(rest.arrows, (a, f) => ({ ...a, a: point(f, a.a), b: point(f, a.b) })),
            dots: placed(rest.dots, (d, f, copy) => ({ ...d, point: point(f, d.point), normals: d.normals?.map(n => normal(f, n)), owner: owner(d.owner, copy) })),
        };
    }

    // The rotation fit must cover the whole loop: the exact reach of everything that stays put,
    // plus each moving part's extreme points carried through sampled poses.
    const SAMPLES = 48, moving = new Set<string>();
    const samples = Array.from({ length: SAMPLES + 1 }, (_, i) => posesAt(i / SAMPLES));
    samples.forEach(poses => poses.forEach((_, name) => moving.add(name)));
    const still: Scene = { ...rest, lines: rest.lines.filter(l => !moving.has(l.part!)), faces: rest.faces.filter(f => !moving.has(f.part!)), arrows: rest.arrows.filter(a => !moving.has(a.part!)), dots: rest.dots.filter(d => !moving.has(d.part!)) };
    const swept: V[] = [], atRest = fitted({});
    for (const name of moving) {
        const points = [...rest.lines.filter(l => l.part === name).flatMap(l => l.points), ...rest.faces.filter(f => f.part === name).flatMap(f => f.points), ...rest.arrows.filter(a => a.part === name).flatMap(a => [a.a, a.b]), ...rest.dots.filter(d => d.part === name).map(d => d.point)];
        if (!points.length) continue;
        const hull = extremes(points);
        for (const poses of samples) for (const f of poses.get(name) ?? [atRest]) for (const p of hull) swept.push(point(f, p));
    }
    const extents = new Map<string, number>();
    function extent(view: Pick<View, 'yaw' | 'pitch'>) {
        const key = `${view.yaw.toFixed(6)},${view.pitch.toFixed(6)}`;
        let value = extents.get(key);
        if (value === undefined) {
            const raw = viewTransform(view);
            value = sceneExtent(still, raw);
            for (const p of swept) { const q = raw(p); value = Math.max(value, Math.abs(q[0]), Math.abs(q[1])); }
            if (extents.size > 64) extents.clear();
            extents.set(key, value);
        }
        return value;
    }
    return { seconds: loop.seconds, scene, extent };
}
