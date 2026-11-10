import { add, sub, mul, dot, cross, unit, average, circlePoints, count, type V, type Scene } from './geometry';
export const X: V = [1, 0, 0], Y: V = [0, 1, 0], Z: V = [0, 0, 1];
let owner = 0;
export function stroke(s: Scene, points: V[], options: Partial<Scene['lines'][number]> = {}) { s.lines.push({ points, width: 1, ...options }); }
export function plane(s: Scene, center: V, u: V, v: V, width: number, height: number, highlight = false, dash?: number[], holeSize?: [
    number,
    number
], holeCenter?: V) {
    count(s, 'plane');
    const id = ++owner;
    const rect = (c: V, w: number, h: number) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => add(c, add(mul(u, a * w / 2), mul(v, b * h / 2))));
    const points = rect(center, width, height), hole = holeSize ? rect(holeCenter ?? center, ...holeSize) : undefined;
    s.faces.push({ points, hole, owner: id });
    stroke(s, points, { closed: true, highlight, dash, owner: id });
    if (hole)
        stroke(s, hole, { closed: true, highlight, owner: id });
    if (highlight)
        s.highlights.push({ points, hole, kind: 'diamond', gradient: [center, add(center, mul(u, width / 2)), add(center, mul(v, height / 2))] });
    return { points, hole, owner: id };
}
export function ring(s: Scene, center: V, r: number, u: V = X, v: V = Z, options: {
    highlight?: boolean;
    surface?: boolean;
    dash?: number[];
} = {}) {
    count(s, 'circle');
    const id = ++owner, points = circlePoints(center, r, u, v);
    stroke(s, points, { closed: true, highlight: options.highlight, owner: id, dash: options.dash });
    if (options.surface)
        s.faces.push({ points, owner: id });
    if (options.highlight)
        s.highlights.push({ points, kind: 'radial', gradient: [center, add(center, mul(u, r)), add(center, mul(v, r))] });
    return points;
}
export function box(s: Scene, center: V, size: V, options: {
    highlight?: boolean;
    wire?: boolean;
    grid?: boolean;
    nodes?: boolean;
} = {}) {
    count(s, 'box');
    const id = ++owner;
    const vertices = [[-1, -1, -1], [1, -1, -1], [1, -1, 1], [-1, -1, 1], [-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]].map(p => add(center, p.map((v, i) => v * size[i] / 2) as V));
    const quads = [[0, 1, 2, 3], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0], [4, 7, 6, 5]];
    const faces = quads.map(ids => { let points = ids.map(i => vertices[i]), normal = unit(cross(sub(points[1], points[0]), sub(points[2], points[0]))); if (dot(normal, sub(average(points), center)) < 0) {
        points.reverse();
        normal = mul(normal, -1);
    } return { points, normal, ids }; });
    if (!options.wire)
        for (const f of faces)
            s.faces.push({ points: f.points, owner: id });
    const edges = new Map<string, {
        a: number;
        b: number;
        normals: V[];
    }>();
    for (const f of faces)
        for (let i = 0; i < 4; i++) {
            const a = f.ids[i], b = f.ids[(i + 1) % 4], key = [a, b].sort().join(',');
            if (!edges.has(key))
                edges.set(key, { a, b, normals: [] });
            edges.get(key)!.normals.push(f.normal);
        }
    for (const { a, b, normals } of edges.values())
        stroke(s, [vertices[a], vertices[b]], { normals, owner: id, highlight: options.highlight });
    if (options.highlight)
        s.highlights.push({ points: vertices, mesh: faces.map(f => f.points), kind: 'radial', gradient: [] });
    if (options.grid)
        for (const f of faces) {
            const [a, b, c, d] = f.points;
            for (const points of [[average([a, b]), average([c, d])], [average([b, c]), average([d, a])]])
                stroke(s, points, { normals: [f.normal], owner: id });
        }
    if (options.nodes) {
        const nodes = new Map<string, {
            point: V;
            normals: V[];
        }>();
        for (const f of faces) {
            const pts = [...f.points, average(f.points), ...f.points.map((p, i) => average([p, f.points[(i + 1) % 4]]))];
            for (const p of pts) {
                const key = p.join(',');
                if (!nodes.has(key))
                    nodes.set(key, { point: p, normals: [] });
                nodes.get(key)!.normals.push(f.normal);
            }
        }
        for (const n of nodes.values())
            s.dots.push({ ...n, r: size[0] * .022, owner: id });
    }
    return { vertices, faces, owner: id };
}
export function ellipsoid(s: Scene, center: V, axes: [
    V,
    V,
    V
], options: {
    half?: boolean;
    highlight?: boolean;
    wire?: boolean;
} = {}) {
    count(s, options.half ? 'hemisphere' : 'sphere');
    const id = ++owner;
    const rows = options.half ? 24 : 32, cols = 96;
    const point = (j: number, i: number): V => { const lat = options.half ? j / rows * Math.PI / 2 : (j / rows - .5) * Math.PI, angle = i / cols * Math.PI * 2; return add(center, add(add(mul(axes[0], Math.cos(lat) * Math.cos(angle)), mul(axes[1], Math.cos(lat) * Math.sin(angle))), mul(axes[2], -Math.sin(lat)))); };
    if (!options.wire)
        for (let j = 0; j < rows; j++)
            for (let i = 0; i < cols; i++)
                s.faces.push({ points: [point(j, i), point(j + 1, i), point(j + 1, i + 1), point(j, i + 1)], owner: id });
    s.contours.push({ center, axes, half: options.half, highlight: options.highlight, width: 1, owner: id });
    if (options.half)
        stroke(s, Array.from({ length: cols }, (_, i) => point(0, i)), { closed: true, owner: id });
    return id;
}
export function tube(s: Scene, center: V, r: number, inner: number, thickness: number, u: V = X, v: V = Z, highlight = false) {
    count(s, 'hollow-cylinder');
    const id = ++owner, n = unit(cross(u, v)), mesh: V[][] = [];
    const top = circlePoints(center, r, u, v), hole = circlePoints(center, inner, u, v), bottom = circlePoints(add(center, mul(n, thickness)), r, u, v), bottomHole = circlePoints(add(center, mul(n, thickness)), inner, u, v);
    for (let i = 0; i < top.length; i++) {
        const j = (i + 1) % top.length;
        for (const points of [[top[i], top[j], hole[j], hole[i]], [bottom[i], bottom[j], bottomHole[j], bottomHole[i]], [top[i], top[j], bottom[j], bottom[i]], [hole[i], hole[j], bottomHole[j], bottomHole[i]]]) {
            mesh.push(points);
            s.faces.push({ points, owner: id });
        }
    }
    for (const pts of [top, hole, bottom, bottomHole])
        stroke(s, pts, { closed: true, owner: id, highlight });
    // Only the two side silhouette generators are added, not every mesh edge.
    s.cylinders.push({ top: center, axis: mul(n, thickness), u, v, r, inner, owner: id, highlight, width: 1 });
    if (highlight)
        s.highlights.push({ points: [...top, ...bottom], mesh, kind: 'radial', gradient: [] });
}
export function frustumBand(s: Scene, outerCenter: V, r: number, innerCenter: V, inner: number, u: V = X, v: V = Z, highlight = true) {
    count(s, 'conical-ring');
    const id = ++owner, outer = circlePoints(outerCenter, r, u, v), hole = circlePoints(innerCenter, inner, u, v), mesh: V[][] = [];
    for (let i = 0; i < outer.length; i++) {
        const j = (i + 1) % outer.length, points = [outer[i], outer[j], hole[j], hole[i]];
        mesh.push(points);
        s.faces.push({ points, owner: id });
    }
    for (const points of [outer, hole])
        stroke(s, points, { closed: true, owner: id, highlight });
    if (highlight)
        s.highlights.push({ points: outer, hole, kind: 'radial', gradient: [outerCenter, add(outerCenter, mul(u, r)), add(outerCenter, mul(v, r))] });
}
export function curve(s: Scene, a: V, b: V, c: V, d: V) { count(s, 'bezier-curve'); stroke(s, Array.from({ length: 81 }, (_, i) => { const t = i / 80, k = 1 - t; return add(add(mul(a, k ** 3), mul(b, 3 * k * k * t)), add(mul(c, 3 * k * t * t), mul(d, t ** 3))); })); }
export function arrow(s: Scene, a: V, b: V, size = 5, planeNormal?: V) {
    count(s, 'arrow');
    if (!planeNormal) { s.arrows.push({ a, b, size }); return; }
    // A planar diagram needs a physical arrowhead that rotates with its surface.
    const direction = unit(sub(b, a)), side = unit(cross(planeNormal, direction));
    const base = sub(b, mul(direction, size)), wing = mul(side, size * .57);
    stroke(s, [a, b]);
    stroke(s, [add(base, wing), b, sub(base, wing)]);
}
