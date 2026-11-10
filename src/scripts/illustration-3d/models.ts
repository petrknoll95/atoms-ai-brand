import metrics from './data/reference-metrics.json';
import { add, mul, sub, around, fromView, project, transformScene, scene, type Scene, type V } from './geometry';
import { X, Y, Z, box, plane, ring, ellipsoid, tube, frustumBand, stroke, curve, arrow } from './primitives';
export const SLUGS = Object.keys(metrics);
const right = fromView(1, 0), down = fromView(0, 1);
const poseIso = (s: Scene) => { const fn = (p: V) => around(p, right, Math.atan(1 / Math.sqrt(2)) - Math.PI / 6); transformScene(s, fn, fn); };
const sphere = (s: Scene, c: V, r: number, highlight = false, wire = false) => ellipsoid(s, c, [mul(X, r), mul(Z, r), mul(Y, r)], { highlight, wire });
const frame = (ratio: number) => ({ u: right, v: fromView(0, ratio, Math.sqrt(1 - ratio * ratio)), normal: fromView(0, -Math.sqrt(1 - ratio * ratio), ratio) });
/** Scenes are assembled only from complete, dimensioned 3D primitives. */
export function makeScene(slug: string): Scene {
    const s = scene();
    switch (slug) {
        case 'stack':
        case 'layers':
        case 'states': {
            const n = slug === 'stack' ? 5 : 3;
            for (let i = 0; i < n; i++)
                plane(s, [0, (i - (n - 1) / 2) * 28.8675, 0], X, Z, 141.421, 141.421, i === Math.floor(n / 2), slug === 'states' && i !== 1 ? [7.8, 7.8] : undefined);
            if (slug === 'states')
                poseIso(s);
            break;
        }
        case 'stack-2': {
            const { u, v, normal } = frame(1 / 3);
            for (let i = 0; i < 6; i++)
                ring(s, mul(normal, (i - 2.5) * 24 / Math.sqrt(8 / 9)), 90, u, v, { surface: true, highlight: i === 0 || i === 5 });
            break;
        }
        case 'built-in-your-stack': {
            box(s, [0, 0, 0], [140, 140, 140], { wire: true, grid: true, nodes: true });
            plane(s, [35, 70, -35], X, Z, 70, 70, true);
            poseIso(s);
            break;
        }
        case 'modular': {
            const largeCenter: V = [-17, 0, 0], largeSize: V = [144, 144, 144];
            box(s, largeCenter, largeSize, { wire: true });
            box(s, [-17, -5, 0], [62, 62, 62], { wire: true });
            // The highlighted cube's center coincides with the large cube's top-right vertex.
            const highlightedCenter: V = [largeCenter[0] + largeSize[0] / 2, largeCenter[1] + largeSize[1] / 2, largeCenter[2] - largeSize[2] / 2];
            box(s, highlightedCenter, [62, 62, 62], { highlight: true });
            poseIso(s);
            break;
        }
        case 'nested': {
            box(s, [0, 0, 0], [132, 132, 132], { wire: true });
            s.lines.forEach(l => delete l.normals);
            box(s, [0, 0, 0], [68, 68, 68], { highlight: true });
            poseIso(s);
            break;
        }
        case 'momentum': {
            for (let i = 0; i < 5; i++) {
                const h = 30 + i * 30;
                box(s, [(i - 2) * 44, h / 2, 0], [44, h, 70], { highlight: i === 4 });
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
                s.dots.push({ point: add(c, add(mul(u, 125 * Math.cos(a)), mul(down, 125 * Math.sin(a)))), r: 4 });
            });
            break;
        }
        case 'compounding-outcomes': {
            const rs = [128, 96, 62, 38, 16];
            // The circles and the complete arrow form one flat diagram in 3D.
            rs.forEach((r, i) => ring(s, fromView((r - 128) * Math.SQRT1_2, (128 - r) * Math.SQRT1_2), r, right, down, { surface: i === 2, highlight: i === 2 }));
            arrow(s, fromView(-67.88, 67.88), fromView(72, -72), 10, fromView(0, 0, 1));
            break;
        }
        case 'orbit': {
            sphere(s, [0, 0, 0], 100, true);
            for (const angle of [-Math.PI / 4, Math.PI / 4]) {
                const u = fromView(.4 * Math.cos(angle), .4 * Math.sin(angle), Math.sqrt(.84)), v = fromView(-Math.sin(angle), Math.cos(angle));
                ring(s, [0, 0, 0], 125, u, v);
            }
            break;
        }
        case 'input': {
            const { u, v, normal } = frame(.25);
            ellipsoid(s, [0, 0, 0], [mul(u, 100), mul(v, 100), mul(normal, 100)], { half: true });
            sphere(s, mul(normal, 50 / Math.sqrt(15 / 16)), 50, true);
            break;
        }
        case 'focus': {
            const { u, v, normal } = frame(.5), r = 119.467;
            ellipsoid(s, [0, 0, 0], [mul(u, r), mul(v, r), mul(normal, 96.5)], { half: true });
            frustumBand(s, [0, 0, 0], r, mul(normal, -8.306 / Math.sqrt(.75)), 93.147, u, v);
            for (const [radius, dy] of [[72.707, 16.707], [56.653, 25.013], [44.24, 33.413]])
                ring(s, mul(normal, -dy / Math.sqrt(.75)), radius, u, v);
            for (const [dy, radius] of [[-93.24, 8.4], [-39.48, 11.947], [26.226, 15.493]])
                sphere(s, mul(normal, -dy / Math.sqrt(.75)), radius, false, true);
            break;
        }
        case 'always-on': {
            s.hiddenLines = 'omit';
            for (const [r, inner, y] of [[50.586, 29.4, -79.59], [73.547, 44.147, -26.53], [96.507, 56.934, 26.53], [119.467, 71.68, 79.59]])
                tube(s, [0, y, 0], r, inner, 12.74, X, Z, r > 110);
            break;
        }
        case 'filtering': {
            plane(s, [0, 0, 0], X, Z, 148, 148, true);
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
            for (let i = 0; i < 7; i++) {
                const t = (i - 3) / 3;
                const reach = 90 / normalX, spread = mul(down, t * 60);
                stroke(s, [add(mul(axis, -reach), spread), center]);
                const end = add(mul(axis, reach), spread);
                arrow(s, center, end, 7);
            }
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
            const faceOn = (p: V) => fromView(p[0], p[2], p[1]);
            transformScene(s, faceOn, faceOn);
            break;
        }
        case 'unfolding': {
            // Equal-size pages mirror across the upright center page and share one spine.
            const pageSize = 138.59, hinge: V = [0, 0, 0], pageCount = 9;
            for (let i = 0; i < pageCount; i++) {
                const angle = i * Math.PI / (pageCount - 1);
                const direction: V = [0, Math.sin(angle), -Math.cos(angle)];
                plane(s, add(hinge, mul(direction, pageSize / 2)), X, direction, pageSize, pageSize, i === (pageCount - 1) / 2);
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
            arrow(s, [0, 25, 0], [0, 62, 0], 4);
            arrow(s, [0, 25, -25], [0, 25, -48], 4);
            arrow(s, [-25, 25, 0], [-48, 25, 0], 4);
            arrow(s, [-25, 0, 25], [-48, 0, 25], 4);
            arrow(s, [25, 0, -25], [25, 0, -48], 4);
            arrow(s, [0, 25, 25], [0, -30, 25], 4);
            arrow(s, [25, 25, 0], [25, -30, 0], 4);
            poseIso(s);
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
    s.frameAspect = ref.frame[0] / ref.frame[1];
    // Uniform line weight is a presentation setting, independent of model units.
    s.lines.forEach(l => l.width = 1.28);
    s.contours.forEach(c => c.width = 1.28);
    s.cylinders.forEach(c => c.width = 1.28);
    return s;
}
