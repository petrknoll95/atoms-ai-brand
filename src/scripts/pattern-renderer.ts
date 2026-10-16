// Canvas renderer for the interference patterns described in src/data/patterns.ts.
import {
  FIELD,
  VISIBLE,
  SLITS,
  ringLayers,
  ringMaskUrl,
  slitLayers,
  structure as getStructure,
  type Colors,
  type Curve,
  type PatternNode,
  type SlitMask,
  type StructureId,
  type Transform,
} from '../data/patterns';

const INSET = (FIELD - VISIBLE) / 2;
const MAX_FIELD = 4096;

const makeCanvas = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
};

/** Free a scratch canvas's backing store right away (large exports allocate a lot). */
const release = (c: HTMLCanvasElement) => {
  c.width = 0;
  c.height = 0;
};

/** Cut the visible 800 × 800 frame out of the 840 × 840 field. */
function crop(full: HTMLCanvasElement, k: number, size: number) {
  const out = makeCanvas(size, size);
  out.getContext('2d')!.drawImage(full, INSET * k, INSET * k, VISIBLE * k, VISIBLE * k, 0, 0, out.width, out.height);
  release(full);
  return out;
}

const smoothstep = (u: number) => u * u * (3 - 2 * u);

/** White radial gradient (center 0.5, radius 0.5 in gradient space) with Figma's falloff. */
function gradientFor(ctx: CanvasRenderingContext2D, curve: Curve) {
  const g = ctx.createRadialGradient(0.5, 0.5, 0, 0.5, 0.5, 0.5);
  const white = (a: number) => `rgba(255,255,255,${a.toFixed(4)})`;
  if (Array.isArray(curve)) {
    const last = curve.length - 1;
    curve.forEach((a, j) => g.addColorStop(j / last, white(a)));
  } else if (curve === 'cosine') {
    for (let j = 0; j <= 32; j++) {
      const t = j / 32;
      g.addColorStop(t, white((1 + Math.cos(Math.PI * t)) / 2));
    }
  } else {
    const start = curve === 'fade86' ? 0.86 : 0.72;
    g.addColorStop(0, white(1));
    for (let j = 0; j <= 20; j++) {
      const u = j / 20;
      g.addColorStop(start + (1 - start) * u, white(1 - smoothstep(u)));
    }
  }
  return g;
}

/** Draw one Figma radial paint into the unit square of the current transform. */
function paintGradient(ctx: CanvasRenderingContext2D, T: Transform, curve: Curve) {
  const [[a, b, tx], [c, d, ty]] = T;
  const det = a * d - b * c;
  const ia = d / det;
  const ib = -b / det;
  const ic = -c / det;
  const id = a / det;
  // Bounding box of the unit square in gradient space, so the fill covers the slit.
  const corners = [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ].map(([x, y]) => [a * x + b * y + tx, c * x + d * y + ty]);
  const xs = corners.map((p) => p[0]);
  const ys = corners.map((p) => p[1]);
  const pad = 0.05;
  const x0 = Math.min(...xs) - pad;
  const y0 = Math.min(...ys) - pad;
  ctx.save();
  // Gradient space → node space: p = A⁻¹·g − A⁻¹·t
  ctx.transform(ia, ic, ib, id, -(ia * tx + ib * ty), -(ic * tx + id * ty));
  ctx.fillStyle = gradientFor(ctx, curve);
  ctx.fillRect(x0, y0, Math.max(...xs) + pad - x0, Math.max(...ys) + pad - y0);
  ctx.restore();
}

interface FieldContext {
  width: number;
  height: number;
  k: number; // px per field unit
  slits: number;
  colors: Colors;
}

/** Alpha mask: the same gradients drawn into every slit, blurred if the Figma layer is. */
function drawMask(ctx: FieldContext, mask: SlitMask) {
  const canvas = makeCanvas(ctx.width, ctx.height);
  const m = canvas.getContext('2d')!;
  m.globalAlpha = mask.slitOpacity ?? 1;
  const slitW = FIELD / ctx.slits;
  for (let i = 0; i < ctx.slits; i++) {
    m.save();
    m.setTransform(ctx.k, 0, 0, ctx.k, i * slitW * ctx.k, 0);
    m.beginPath();
    m.rect(0, 0, slitW, FIELD);
    m.clip();
    m.transform(slitW, 0, 0, FIELD, 0, 0); // unit square = this slit
    for (const T of mask.paints) paintGradient(m, T, mask.curve);
    m.restore();
  }
  return canvas;
}

/** Keep only what the mask lets through (multiplied by the mask layer's opacity). */
function applyMask(target: HTMLCanvasElement, ctx: FieldContext, mask: SlitMask) {
  const maskCanvas = drawMask(ctx, mask);
  const t = target.getContext('2d')!;
  t.save();
  t.globalCompositeOperation = 'destination-in';
  t.globalAlpha = mask.opacity ?? 1;
  if (mask.blur) t.filter = `blur(${(mask.blur * ctx.k).toFixed(2)}px)`;
  t.drawImage(maskCanvas, 0, 0);
  t.restore();
  release(maskCanvas);
}

/** Render one node of the layer tree into its own canvas (groups are isolated, then masked). */
function renderNode(ctx: FieldContext, node: PatternNode): HTMLCanvasElement {
  const canvas = makeCanvas(ctx.width, ctx.height);
  const c = canvas.getContext('2d')!;
  if (node.kind === 'fill') {
    c.fillStyle = ctx.colors[node.role];
    c.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    for (const child of node.children) composite(c, renderNode(ctx, child), child.blend);
  }
  if (node.mask) applyMask(canvas, ctx, node.mask);
  return canvas;
}

function composite(target: CanvasRenderingContext2D, layer: HTMLCanvasElement, blend: CanvasRenderingContext2D['globalCompositeOperation']) {
  target.globalCompositeOperation = blend;
  target.drawImage(layer, 0, 0);
  target.globalCompositeOperation = 'source-over';
  release(layer);
}

function renderSlitField(size: number, layers: PatternNode[], slits: number, colors: Colors) {
  const k = size / VISIBLE;
  const full = makeCanvas(FIELD * k, FIELD * k);
  const main = full.getContext('2d')!;
  main.fillStyle = colors.base;
  main.fillRect(0, 0, full.width, full.height);
  const ctx: FieldContext = { width: full.width, height: full.height, k, slits, colors };
  for (const node of layers) composite(main, renderNode(ctx, node), node.blend);
  return crop(full, k, size);
}

// ---------- Concentric ----------

const maskImages = new Map<string, Promise<HTMLImageElement>>();

function loadMask(url: string) {
  if (!maskImages.has(url)) {
    maskImages.set(
      url,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load ${url}`));
        img.src = url;
      }),
    );
  }
  return maskImages.get(url)!;
}

async function renderRingField(size: number, density: 1 | 2, colors: Colors) {
  const k = size / VISIBLE;
  const full = makeCanvas(FIELD * k, FIELD * k);
  const main = full.getContext('2d')!;
  main.fillStyle = colors.base;
  main.fillRect(0, 0, full.width, full.height);

  for (const layer of ringLayers) {
    const tinted = makeCanvas(full.width, full.height);
    const t = tinted.getContext('2d')!;
    t.fillStyle = colors[layer.role];
    if (layer.uniform !== undefined) {
      t.globalAlpha = layer.uniform;
      t.fillRect(0, 0, tinted.width, tinted.height);
    } else {
      const mask = await loadMask(ringMaskUrl(density, layer.role));
      t.fillRect(0, 0, tinted.width, tinted.height);
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(mask, 0, 0, tinted.width, tinted.height);
    }
    main.globalCompositeOperation = layer.blend;
    main.drawImage(tinted, 0, 0);
    main.globalCompositeOperation = 'source-over';
    release(tinted);
  }

  return crop(full, k, size);
}

// ---------- Public API ----------

export interface PatternOptions {
  structure: StructureId;
  /** Density index: 0–3 for slit structures, 1–2 for concentric. */
  density: number;
  /** Slit count for slit structures; overrides `density` (the generator's in-between stops). */
  slits?: number;
  colors: Colors;
}

const fieldCache = new Map<string, Promise<HTMLCanvasElement>>();

/** A square render of the visible 800 × 800 field at `size` px. */
export function renderField(opts: PatternOptions, size: number): Promise<HTMLCanvasElement> {
  const s = Math.round(size);
  const key = `${opts.structure}|${opts.density}|${opts.slits ?? ''}|${Object.values(opts.colors).join(',')}|${s}`;
  const cached = fieldCache.get(key);
  if (cached) return cached;
  const field =
    opts.structure === 'concentric'
      ? renderRingField(s, opts.density === 2 ? 2 : 1, opts.colors)
      : Promise.resolve(renderSlitField(s, slitLayers[opts.structure], opts.slits ?? SLITS[opts.density] ?? 10, opts.colors));
  if (fieldCache.size > 24) fieldCache.delete(fieldCache.keys().next().value!);
  fieldCache.set(key, field);
  return field;
}

export interface ComposeOptions extends PatternOptions {
  width: number;
  height: number;
  /** Degrees. The field is rotated, never skewed or stretched. */
  rotation?: number;
  /** ≥ 1 — how far the field is scaled beyond the minimum cover. */
  zoom?: number;
  /** −1…1 pan across the cropped overflow. */
  panX?: number;
  panY?: number;
}

/** Render a crop of the field into `canvas` at exactly width × height px. */
export async function composePattern(canvas: HTMLCanvasElement, o: ComposeOptions) {
  const { width: W, height: H, rotation = 0, zoom = 1, panX = 0, panY = 0 } = o;
  const rad = (rotation * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rad));
  const sin = Math.abs(Math.sin(rad));
  // Bounding box of the output, in field orientation; the square field must cover it.
  const bw = W * cos + H * sin;
  const bh = W * sin + H * cos;
  const S = Math.max(bw, bh) * Math.max(1, zoom);
  // Very large crops render the field at a capped resolution and scale it up; the field is soft anyway.
  const field = await renderField(o, Math.min(S, MAX_FIELD));
  canvas.width = Math.round(W);
  canvas.height = Math.round(H);
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(rad);
  const ox = (panX * (S - bw)) / 2;
  const oy = (panY * (S - bh)) / 2;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(field, -S / 2 - ox, -S / 2 - oy, S, S);
  ctx.restore();
}

export const colorwayFor = (id: StructureId, name: string): Colors => {
  const s = getStructure(id);
  return name === 'Master' ? s.master : s.colorways[name as keyof typeof s.colorways];
};
