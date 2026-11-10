/** Shared world-space geometry and orthographic camera for every p5 instance. */
export type V = [
    number,
    number,
    number
];
export type Stroke = {
    silhouette?: boolean;
    points: V[];
    closed?: boolean;
    dash?: number[];
    highlight?: boolean;
    width?: number;
    normals?: V[];
    owner?: number;
};
export type Face = {
    points: V[];
    hole?: V[];
    owner?: number;
};
export type Highlight = {
    points: V[];
    hole?: V[];
    /** Outward normal for a highlight attached to one opaque surface. */
    normal?: V;
    kind: 'radial' | 'diamond';
    gradient: V[];
    mesh?: V[][];
};
export type Contour = {
    center: V;
    axes: [
        V,
        V,
        V
    ];
    half?: boolean;
    highlight?: boolean;
    width: number;
    owner: number;
};
export type Cylinder = {
    top: V;
    axis: V;
    u: V;
    v: V;
    r: number;
    inner: number;
    owner: number;
    highlight: boolean;
    width: number;
};
export type Scene = {
    /** Omit occluded strokes, including accent outlines, for opaque examples. */
    hiddenLines?: 'omit';
    cylinders: Cylinder[];
    arrows: {
        a: V;
        b: V;
        size: number;
    }[];
    lines: Stroke[];
    faces: Face[];
    highlights: Highlight[];
    contours: Contour[];
    dots: {
        point: V;
        r: number;
        normals?: V[];
        owner?: number;
    }[];
    frameAspect?: number;
    primitiveCounts: Record<string, number>;
};
export const CAMERA = { yaw: Math.PI / 4, pitch: Math.PI / 6, size: 384, hiddenOpacity: .35, iris: '#A77BCA' };
const c = Math.SQRT1_2, s = .5, h = Math.sqrt(3) / 2;
export const add = (a: V, b: V): V => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const sub = (a: V, b: V): V => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const mul = (a: V, k: number): V => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V, b: V) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V, b: V): V => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const unit = (a: V): V => mul(a, 1 / Math.hypot(...a));
export const lerp = (a: V, b: V, t: number): V => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const average = (p: V[]): V => mul(p.reduce(add, [0, 0, 0]), 1 / p.length);
export function project(p: V): V { return [c * (p[0] - p[2]), s * c * (p[0] + p[2]) - h * p[1], h * c * (p[0] + p[2]) + s * p[1]]; }
export function fromView(x: number, y: number, z = 0): V { return [c * x + s * c * y + h * c * z, -h * y + s * z, -c * x + s * c * y + h * c * z]; }
export function rotate(p: V, yaw: number, pitch: number): V { const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch), x = p[0] * cy + p[2] * sy, z = -p[0] * sy + p[2] * cy; return [x, p[1] * cp - z * sp, p[1] * sp + z * cp]; }
export function around(p: V, axis: V, angle: number): V { const n = unit(axis); return add(add(mul(p, Math.cos(angle)), mul(cross(n, p), Math.sin(angle))), mul(n, dot(n, p) * (1 - Math.cos(angle)))); }
export const scene = (): Scene => ({ cylinders: [], arrows: [], lines: [], faces: [], highlights: [], contours: [], dots: [], primitiveCounts: {} });
export function count(s: Scene, key: string) { s.primitiveCounts[key] = (s.primitiveCounts[key] ?? 0) + 1; }
export function circlePoints(center: V, r: number, u: V, v: V, n = 128): V[] { return Array.from({ length: n }, (_, i) => add(center, add(mul(u, r * Math.cos(i / n * Math.PI * 2)), mul(v, r * Math.sin(i / n * Math.PI * 2))))); }
export function transformScene(s: Scene, point: (p: V) => V, vector: (p: V) => V, scale = 1) {
    for (const c of s.cylinders) {
        c.top = point(c.top);
        c.axis = mul(vector(c.axis), scale);
        c.u = vector(c.u);
        c.v = vector(c.v);
        c.r *= scale;
        c.inner *= scale;
        c.width *= scale;
    }
    for (const a of s.arrows) {
        a.a = point(a.a);
        a.b = point(a.b);
        a.size *= scale;
    }
    for (const l of s.lines) {
        l.points = l.points.map(point);
        l.normals = l.normals?.map(vector);
        if (l.width)
            l.width *= scale;
        if (l.dash)
            l.dash = l.dash.map(v => v * scale);
    }
    for (const f of s.faces) {
        f.points = f.points.map(point);
        f.hole = f.hole?.map(point);
    }
    for (const g of s.highlights) {
        g.points = g.points.map(point);
        g.hole = g.hole?.map(point);
        g.normal = g.normal && vector(g.normal);
        g.gradient = g.gradient.map(point);
        g.mesh = g.mesh?.map(p => p.map(point));
    }
    for (const c of s.contours) {
        c.center = point(c.center);
        c.axes = c.axes.map(a => mul(vector(a), scale)) as [
            V,
            V,
            V
        ];
        c.width *= scale;
    }
    for (const d of s.dots) {
        d.point = point(d.point);
        d.normals = d.normals?.map(vector);
        d.r *= scale;
    }
}
