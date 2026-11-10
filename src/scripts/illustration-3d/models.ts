import metrics from './data/reference-metrics.json';
import { add, mul, sub, cross, unit, around, circlePoints, fromView, project, transformScene, scene, type PartInfo, type Scene, type V } from './geometry';
import { X, Y, Z, box, plane, ring, ellipsoid, tube, frustumBand, stroke, curve, arrow } from './primitives';
export const SLUGS = Object.keys(metrics);
const right = fromView(1, 0), down = fromView(0, 1);
/** Rigidly pose the finished model, recording the rotation so motion stays in model space. */
const posed = (s: Scene, fn: (p: V) => V) => { transformScene(s, fn, fn); s.pose = [fn(X), fn(Y), fn(Z)]; };
const poseIso = (s: Scene) => posed(s, p => around(p, right, Math.atan(1 / Math.sqrt(2)) - Math.PI / 6));
const sphere = (s: Scene, c: V, r: number, highlight = false, wire = false) => ellipsoid(s, c, [mul(X, r), mul(Z, r), mul(Y, r)], { highlight, wire });
const frame = (ratio: number) => ({ u: right, v: fromView(0, ratio, Math.sqrt(1 - ratio * ratio)), normal: fromView(0, -Math.sqrt(1 - ratio * ratio), ratio) });
/** Name every element a builder adds, so a motion loop can move it as one part. */
function part<T>(s: Scene, name: string, info: PartInfo, build: () => T): T {
    const lists: { part?: string }[][] = [s.lines, s.faces, s.highlights, s.contours, s.cylinders, s.arrows, s.dots];
    const before = lists.map(list => list.length);
    const result = build();
    lists.forEach((list, i) => { for (let j = before[i]; j < list.length; j++) list[j].part = name; });
    (s.parts ??= {})[name] = info;
    return result;
}
/** The AtomsAI user icon at 10×: shoulders 14 × 6, head r 3.5, head clearance 3. */
const USER = { shoulders: 70, height: 60, head: 35, clearance: 30 };
/**
 * A user: a sphere head resting on the apex of a half-ellipsoid of shoulders, on the ground
 * plane. The head is a movable part; `lift` is the icon's head clearance.
 */
function user(s: Scene, base: V, name: string, highlight: boolean) {
    const { shoulders: r, height: h, head, clearance } = USER;
    const shoulders = ellipsoid(s, base, [mul(X, r), mul(Z, r), mul(Y, -h)], { half: true });
    // Close the solid with its base disk: the rim's own 96 points and owner, no second stroke.
    s.faces.push({ points: circlePoints(base, r, X, Z, 96), owner: shoulders });
    // The head touches the apex at one point on the shared vertical axis.
    const center = add(base, mul(Y, h + head));
    part(s, name, { center, radius: head, lift: clearance }, () => sphere(s, center, head, highlight));
}
/** Scenes are assembled only from complete, dimensioned 3D primitives. */
export function makeScene(slug: string): Scene {
    const s = scene();
    switch (slug) {
        case 'stack':
        case 'layers':
        case 'states': {
            const n = slug === 'stack' ? 5 : 3;
            for (let i = 0; i < n; i++) {
                const y = (i - (n - 1) / 2) * 28.8675;
                part(s, `sheet-${i}`, { y }, () => plane(s, [0, y, 0], X, Z, 141.421, 141.421, i === Math.floor(n / 2), slug === 'states' && i !== 1 ? [7.8, 7.8] : undefined));
            }
            if (slug === 'states')
                poseIso(s);
            break;
        }
        case 'stack-2': {
            const { u, v, normal } = frame(1 / 3);
            for (let i = 0; i < 6; i++)
                part(s, `ring-${i}`, { step: mul(normal, 24 / Math.sqrt(8 / 9)) }, () => ring(s, mul(normal, (i - 2.5) * 24 / Math.sqrt(8 / 9)), 90, u, v, { surface: true, highlight: i === 0 || i === 5 }));
            break;
        }
        case 'built-in-your-stack': {
            box(s, [0, 0, 0], [140, 140, 140], { wire: true, grid: true, nodes: true });
            // One top quadrant: half the cube's side, so it can travel on the face grid.
            part(s, 'tile', { size: 70 }, () => plane(s, [35, 70, -35], X, Z, 70, 70, true));
            poseIso(s);
            break;
        }
        case 'modular': {
            const largeCenter: V = [-17, 0, 0], largeSize: V = [144, 144, 144];
            box(s, largeCenter, largeSize, { wire: true });
            box(s, [-17, -5, 0], [62, 62, 62], { wire: true });
            // The highlighted cube's center coincides with the large cube's top-right vertex.
            const highlightedCenter: V = [largeCenter[0] + largeSize[0] / 2, largeCenter[1] + largeSize[1] / 2, largeCenter[2] - largeSize[2] / 2];
            part(s, 'module', { center: highlightedCenter, axis: unit(sub(highlightedCenter, largeCenter)) }, () => box(s, highlightedCenter, [62, 62, 62], { highlight: true }));
            poseIso(s);
            break;
        }
        case 'nested': {
            part(s, 'outer', {}, () => box(s, [0, 0, 0], [132, 132, 132], { wire: true }));
            s.lines.forEach(l => delete l.normals);
            part(s, 'inner', {}, () => box(s, [0, 0, 0], [68, 68, 68], { highlight: true }));
            poseIso(s);
            break;
        }
        case 'momentum': {
            for (let i = 0; i < 5; i++) {
                const h = 30 + i * 30;
                part(s, `bar-${i}`, { height: h }, () => box(s, [(i - 2) * 44, h / 2, 0], [44, h, 70], { highlight: i === 4 }));
            }
            poseIso(s);
            break;
        }
        case 'full-visibility': {
            // Four circular hoops tangent at a common point, in different vertical planes.
            const specs = [{ q: .5, side: -1, depth: 1 }, { q: .288, side: -1, depth: -1 }, { q: .5, side: 1, depth: 1 }, { q: .288, side: 1, depth: -1 }];
            specs.forEach(({ q, side, depth }, i) => {
                const u = fromView(q, 0, depth * Math.sqrt(1 - q * q)), c = mul(u, side * 125);
                ring(s, c, 125, u, down, { surface: i === 0, highlight: i === 0 });
                const angles = [3.735, 2.792, 5.62, .265];
                const a = angles[i];
                part(s, `node-${i}`, { center: c, axis: unit(cross(u, down)), side }, () => s.dots.push({ point: add(c, add(mul(u, 125 * Math.cos(a)), mul(down, 125 * Math.sin(a)))), r: 4 }));
            });
            break;
        }
        case 'compounding-outcomes': {
            const rs = [128, 96, 62, 38, 16];
            // Every circle touches the others at one point, the start of the growth arrow.
            const tangent = fromView(-128 * Math.SQRT1_2, 128 * Math.SQRT1_2);
            // The circles and the complete arrow form one flat diagram in 3D.
            rs.forEach((r, i) => part(s, `ring-${i}`, { r, tangent }, () => ring(s, fromView((r - 128) * Math.SQRT1_2, (128 - r) * Math.SQRT1_2), r, right, down, { surface: i === 2, highlight: i === 2 })));
            const start = fromView(-67.88, 67.88), tip = fromView(72, -72);
            part(s, 'arrow', { start, tip, tangent }, () => arrow(s, start, tip, 10, fromView(0, 0, 1)));
            // The planar arrowhead is the last stroke: it travels while the shaft stretches.
            s.lines[s.lines.length - 1].part = 'arrow-head';
            s.parts!['arrow-head'] = {};
            break;
        }
        case 'orbit': {
            sphere(s, [0, 0, 0], 100, true);
            [-Math.PI / 4, Math.PI / 4].forEach((angle, i) => {
                const u = fromView(.4 * Math.cos(angle), .4 * Math.sin(angle), Math.sqrt(.84)), v = fromView(-Math.sin(angle), Math.cos(angle));
                part(s, `hoop-${i}`, { normal: unit(cross(u, v)) }, () => ring(s, [0, 0, 0], 125, u, v));
            });
            break;
        }
        case 'input': {
            const { u, v, normal } = frame(.25);
            ellipsoid(s, [0, 0, 0], [mul(u, 100), mul(v, 100), mul(normal, 100)], { half: true });
            const center = mul(normal, 50 / Math.sqrt(15 / 16));
            part(s, 'ball', { center, axis: normal, radius: 50, bowl: 100 }, () => sphere(s, center, 50, true));
            break;
        }
        case 'focus': {
            const { u, v, normal } = frame(.5), r = 119.467, depth = 96.5;
            ellipsoid(s, [0, 0, 0], [mul(u, r), mul(v, r), mul(normal, depth)], { half: true });
            frustumBand(s, [0, 0, 0], r, mul(normal, -8.306 / Math.sqrt(.75)), 93.147, u, v);
            for (const [radius, dy] of [[72.707, 16.707], [56.653, 25.013], [44.24, 33.413]])
                ring(s, mul(normal, -dy / Math.sqrt(.75)), radius, u, v);
            [[-93.24, 8.4], [-39.48, 11.947], [26.226, 15.493]].forEach(([dy, radius], i) => {
                const offset = -dy / Math.sqrt(.75);
                part(s, `ball-${i}`, { offset, radius, axis: normal, depth }, () => sphere(s, mul(normal, offset), radius, false, true));
            });
            break;
        }
        case 'always-on': {
            s.hiddenLines = 'omit';
            [[50.586, 29.4, -79.59], [73.547, 44.147, -26.53], [96.507, 56.934, 26.53], [119.467, 71.68, 79.59]].forEach(([r, inner, y], i) =>
                part(s, `tier-${i}`, { y }, () => tube(s, [0, y, 0], r, inner, 12.74, X, Z, r > 110)));
            break;
        }
        case 'filtering': {
            part(s, 'filter', {}, () => plane(s, [0, 0, 0], X, Z, 148, 148, true));
            // Width, height and depth vary independently throughout the particle volume.
            const positions = [[-100, 48, -28], [-77, 65, 44], [-92, 84, -6], [-63, 95, -46], [-53, 54, 16], [-27, 80, 58], [-2, 104, -35], [24, 80, 24], [36, 112, 52], [60, 95, -18], [88, 84, 37], [74, 65, -54], [50, 54, -5], [76, 33, 29], [94, 46, -32], [-80, 33, 4]];
            const depth: V = [Math.SQRT1_2, 0, Math.SQRT1_2];
            // Reflect the full 3D cloud across the highlighted plane, not a screen axis.
            positions.forEach(([x, h, z], i) => {
                const footprint = add(mul(right, x), mul(depth, z));
                for (const sign of [-1, 1])
                    s.dots.push({ point: add(footprint, mul(Y, sign * h / Math.sqrt(.75))), r: i === 15 ? 1.87 : 2.48 });
            });
            poseIso(s);
            break;
        }
        case 'precision': {
            const foreshortening = 22 / 79, normalX = Math.sqrt(1 - foreshortening ** 2);
            const u = fromView(foreshortening, 0, -normalX);
            const axis = fromView(normalX, 0, foreshortening), center: V = [0, 0, 0];
            ring(s, center, 79, u, down, { surface: true, highlight: true });
            // Both ray fans occupy the same axial section through the circular lens.
            // Their full segments meet at its center; depth testing handles occlusion.
            part(s, 'rays', { center, spread: down }, () => {
                for (let i = 0; i < 7; i++) {
                    const t = (i - 3) / 3;
                    const reach = 90 / normalX, spread = mul(down, t * 60);
                    stroke(s, [add(mul(axis, -reach), spread), center]);
                    const end = add(mul(axis, reach), spread);
                    arrow(s, center, end, 7);
                }
            });
            s.dots.push({ point: center, r: 2.5 });
            break;
        }
        case 'efficiency': {
            const { u, v } = frame(1); // the grid is a physical vertical plane behind the sphere
            for (const x of [-32.3, -22.9, -13.3, 13.2, 22.9, 32.3])
                stroke(s, [fromView(x, -32.5, -30), fromView(x, 32.9, -30)]);
            for (const y of [-32.5, -22.6, -12.6, 12.3, 22.8, 32.9])
                stroke(s, [fromView(-32.3, y, -30), fromView(32.3, y, -30)]);
            sphere(s, [0, 0, 0], 25.82, true);
            for (const q of [18.16 / 26, 9.618 / 26])
                ring(s, [0, 0, 0], 26, fromView(q, 0, Math.sqrt(1 - q * q)), v);
            arrow(s, fromView(0, 40.5, 30), fromView(0, -40.5, 30), 3);
            arrow(s, fromView(0, -40.5, 30), fromView(0, 40.5, 30), 3);
            arrow(s, fromView(-39.7, 0, 30), fromView(39.7, 0, 30), 3);
            arrow(s, fromView(39.7, 0, 30), fromView(-39.7, 0, 30), 3);
            for (const [x, y] of [[-18.3, -17.9], [25.6, 0], [0, 13.6]])
                ring(s, fromView(x, y, 30), 1.83, u, v);
            break;
        }
        case 'handoff': {
            const bottom: V = [0, -31, 0], top: V = add([0, 31, 0], mul(right, 23));
            const bottomSlot = add(bottom, add(mul(X, 4), mul(Z, 17))), topSlot = add(top, mul(Z, 12));
            const a = plane(s, bottom, X, Z, 112, 112, false, undefined, [14.14, 45.25], bottomSlot);
            const b = plane(s, top, X, Z, 74, 74, true, undefined, [15.56, 32.53], topSlot);
            const start = mul(add(b.hole![0], b.hole![1]), .5), end = mul(add(a.hole![0], a.hole![1]), .5);
            curve(s, start, add(start, [-35, -22, 0]), add(end, [35, 22, 0]), end);
            // View both plate faces square-on while retaining their physical depth.
            posed(s, p => fromView(p[0], p[2], p[1]));
            break;
        }
        case 'unfolding': {
            // Equal-size pages mirror across the upright center page and share one spine.
            const pageSize = 138.59, hinge: V = [0, 0, 0], pageCount = 9;
            for (let i = 0; i < pageCount; i++) {
                const angle = i * Math.PI / (pageCount - 1);
                const direction: V = [0, Math.sin(angle), -Math.cos(angle)];
                part(s, `page-${i}`, { hinge, axis: X, angle }, () => plane(s, add(hinge, mul(direction, pageSize / 2)), X, direction, pageSize, pageSize, i === (pageCount - 1) / 2));
            }
            poseIso(s);
            break;
        }
        case 'versatility': {
            s.hiddenLines = 'omit';
            // Every physical face has four quadrants, including the rear and underside.
            const cube = box(s, [0, 0, 0], [50, 50, 50], { grid: true });
            const accent = cube.faces.find(face => face.normal[0] > .99)!;
            s.highlights.push({ points: accent.points, normal: accent.normal, kind: 'diamond', gradient: [] });
            const nodes: V[] = [[0, 25, -25], [-25, 25, 0], [0, 25, 0], [0, 25, 25], [25, 25, 0], [-25, 0, 25], [25, 0, -25], [25, 0, 25]];
            nodes.forEach(point => s.dots.push({ point, r: 1.8 }));
            const reaches: [V, V][] = [[[0, 25, 0], [0, 62, 0]], [[0, 25, -25], [0, 25, -48]], [[-25, 25, 0], [-48, 25, 0]], [[-25, 0, 25], [-48, 0, 25]], [[25, 0, -25], [25, 0, -48]], [[0, 25, 25], [0, -30, 25]], [[25, 25, 0], [25, -30, 0]]];
            reaches.forEach(([start, end], i) => part(s, `arrow-${i}`, { start, end }, () => arrow(s, start, end, 4)));
            poseIso(s);
            break;
        }
        case 'one-user': {
            s.hiddenLines = 'omit';
            user(s, [0, 0, 0], 'head-0', true);
            break;
        }
        case 'two-users': {
            // 160 apart on the Z axis: shoulder diameter 140 plus 20 clearance. A half turn about Y
            // makes the pair; the nearer user, front left, carries the Iris.
            s.hiddenLines = 'omit';
            [0, 1].forEach(k => user(s, around(mul(Z, 80), Y, k * Math.PI), `head-${k}`, k === 0));
            break;
        }
        case 'three-users': {
            // 120° steps on one circle, so every pair is 160 apart. The front user carries the Iris.
            s.hiddenLines = 'omit';
            const front = unit(add(X, Z));
            [0, 1, 2].forEach(k => user(s, around(mul(front, 160 / Math.sqrt(3)), Y, k * 2 * Math.PI / 3), `head-${k}`, k === 0));
            break;
        }
        default: throw new Error(`Missing primitive scene: ${slug}`);
    }
    return fit(s, slug);
}
function fit(s: Scene, slug: string): Scene {
    const ref = (metrics as Record<string, {
        frame: number[];
        bounds: number[];
    }>)[slug];
    const p = [...s.lines.flatMap(l => l.points), ...s.faces.flatMap(f => f.points), ...s.dots.map(d => d.point), ...s.arrows.flatMap(a => [a.a, a.b])].map(project);
    for (const c of s.contours) {
        const center = project(c.center), axes = c.axes.map(project);
        for (let i = 0; i < 3; i++) {
            const radius = Math.hypot(...axes.map(a => a[i]));
            const low = [...center] as V, high = [...center] as V;
            low[i] -= radius;
            high[i] += radius;
            p.push(low, high);
        }
    }
    const low = [0, 1, 2].map(i => Math.min(...p.map(v => v[i]))), high = [0, 1, 2].map(i => Math.max(...p.map(v => v[i])));
    const referenceMax = Math.max(ref.bounds[2] - ref.bounds[0], ref.bounds[3] - ref.bounds[1]);
    const scale = 256 * referenceMax / Math.max(...ref.frame) / Math.max(high[0] - low[0], high[1] - low[1]);
    const origin = fromView((low[0] + high[0]) / 2, (low[1] + high[1]) / 2, (low[2] + high[2]) / 2);
    transformScene(s, p => mul(sub(p, origin), scale), p => p, scale);
    s.fitted = { origin, scale };
    s.frameAspect = ref.frame[0] / ref.frame[1];
    // Uniform line weight is a presentation setting, independent of model units.
    s.lines.forEach(l => l.width = 1.28);
    s.contours.forEach(c => c.width = 1.28);
    s.cylinders.forEach(c => c.width = 1.28);
    return s;
}
