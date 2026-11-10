import { CAMERA, type V } from './geometry';
import { colors } from '../../data/colors';
import type { DrawDot, DrawLine, ProjectedFrame } from './render';

// Shared scratch surfaces are reused by all previews; only the active card repaints.
let hiddenLayer: HTMLCanvasElement | undefined;
let diamond: HTMLCanvasElement | undefined;
const rgb = [1, 3, 5].map(i => parseInt(CAMERA.iris.slice(i, i + 2), 16)).join(',');

function diamondTexture() {
  if (diamond) return diamond;
  diamond = document.createElement('canvas');
  diamond.width = diamond.height = 512;
  const ctx = diamond.getContext('2d')!;
  const pixels = ctx.createImageData(512, 512);
  const color = [1, 3, 5].map(i => parseInt(CAMERA.iris.slice(i, i + 2), 16));
  for (let y = 0; y < 512; y++) for (let x = 0; x < 512; x++) {
    // The same 96-level edge fade as the vector mask, calculated once.
    const distance = Math.max(Math.abs((x + .5) / 256 - 1), Math.abs((y + .5) / 256 - 1));
    const step = Math.ceil(distance * 96) / 96, i = (y * 512 + x) * 4;
    pixels.data[i] = color[0]; pixels.data[i + 1] = color[1]; pixels.data[i + 2] = color[2];
    pixels.data[i + 3] = Math.round(255 * step * step);
  }
  ctx.putImageData(pixels, 0, 0);
  return diamond;
}

function polygon(path: Path2D, points: V[], positive = false) {
  if (!points.length) return;
  let ordered = points;
  if (positive) {
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const a = points[i], b = points[(i + 1) % points.length];
      area += a[0] * b[1] - b[0] * a[1];
    }
    if (area < 0) ordered = points.slice().reverse();
  }
  path.moveTo(ordered[0][0], ordered[0][1]);
  for (let i = 1; i < ordered.length; i++) path.lineTo(ordered[i][0], ordered[i][1]);
  path.closePath();
}

function linework(ctx: CanvasRenderingContext2D, lines: DrawLine[], dots: DrawDot[], ink: string) {
  ctx.strokeStyle = ctx.fillStyle = ink;
  ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
  // Batch equal strokes into one draw call, retaining individual subpaths.
  const groups = new Map<string, { path: Path2D; line: DrawLine }>();
  for (const line of lines) {
    const key = `${line.width}:${line.dash?.join(',') ?? ''}:${line.dashOffset ?? 0}`;
    let group = groups.get(key);
    if (!group) { group = { path: new Path2D(), line }; groups.set(key, group); }
    group.path.moveTo(line.points[0][0], line.points[0][1]);
    for (let i = 1; i < line.points.length; i++) group.path.lineTo(line.points[i][0], line.points[i][1]);
  }
  for (const { path, line } of groups.values()) {
    ctx.lineWidth = line.width; ctx.setLineDash(line.dash ?? []); ctx.lineDashOffset = line.dashOffset ?? 0; ctx.stroke(path);
  }
  ctx.setLineDash([]); ctx.lineDashOffset = 0;
  const circles = new Path2D();
  for (const { point, r } of dots) { circles.moveTo(point[0] + r, point[1]); circles.arc(point[0], point[1], r, 0, Math.PI * 2); }
  ctx.fill(circles);
}

/** Direct p5 canvas paint: no SVG serialization, DOM parsing, blobs or image decoding. */
export function drawFrame(ctx: CanvasRenderingContext2D, frame: ProjectedFrame) {
  const { width, height } = ctx.canvas, scale = width / CAMERA.size;
  ctx.resetTransform(); ctx.clearRect(0, 0, width, height);
  ctx.setTransform(scale, 0, 0, scale, width / 2, height / 2);
  for (const h of frame.highlights) {
    ctx.save();
    const clip = new Path2D();
    if (h.mesh) {
      // Normalize winding so overlapping projected faces form one silhouette.
      for (const face of h.mesh) polygon(clip, face, true);
      ctx.clip(clip);
    } else {
      polygon(clip, h.points); if (h.hole) polygon(clip, h.hole);
      ctx.clip(clip, 'evenodd');
    }
    if (h.kind === 'diamond') {
      const [a, b, , d] = h.points;
      ctx.transform((b[0] - a[0]) / 512, (b[1] - a[1]) / 512, (d[0] - a[0]) / 512, (d[1] - a[1]) / 512, a[0], a[1]);
      ctx.drawImage(diamondTexture(), 0, 0);
    } else {
      let [c, u, v] = h.gradient;
      if (h.mesh) {
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const face of h.mesh) for (const p of face) {
          minX = Math.min(minX, p[0]); maxX = Math.max(maxX, p[0]);
          minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]);
        }
        c = [(minX + maxX) / 2, (minY + maxY) / 2, 0]; u = [maxX, c[1], 0]; v = [c[0], maxY, 0];
      }
      const ux = u[0] - c[0], uy = u[1] - c[1], vx = v[0] - c[0], vy = v[1] - c[1];
      if (Math.abs(ux * vy - uy * vx) > 1e-8) {
        ctx.transform(ux, uy, vx, vy, c[0], c[1]);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        for (let i = 0; i <= 32; i++) gradient.addColorStop(i / 32, `rgba(${rgb},${(i / 32) ** 3})`);
        ctx.fillStyle = gradient; ctx.fillRect(-4, -4, 8, 8);
      }
    }
    ctx.restore();
  }
  const ink = frame.white ? colors.forestShade.hex : colors.paper.hex;
  if (frame.rear.length || frame.rearDots.length) {
    hiddenLayer ??= document.createElement('canvas');
    if (hiddenLayer.width !== width || hiddenLayer.height !== height) { hiddenLayer.width = width; hiddenLayer.height = height; }
    const rear = hiddenLayer.getContext('2d')!;
    rear.resetTransform(); rear.clearRect(0, 0, width, height);
    rear.setTransform(scale, 0, 0, scale, width / 2, height / 2);
    linework(rear, frame.rear, frame.rearDots, ink);
    // Composite the whole group once, so overlapping hidden lines stay at 35%.
    ctx.save(); ctx.resetTransform(); ctx.globalAlpha = CAMERA.hiddenOpacity;
    ctx.drawImage(hiddenLayer, 0, 0); ctx.restore();
  }
  linework(ctx, frame.front, frame.frontDots, ink);
  linework(ctx, frame.accent, [], ink);
  ctx.resetTransform();
}
