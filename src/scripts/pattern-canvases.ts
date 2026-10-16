// Renders every <canvas data-pattern> on the page once it scrolls into view.
// Optional: data-rotation, data-zoom, data-pan-x / data-pan-y (see composePattern), data-colors (JSON role → color,
// overriding the colorway — Don't examples only) and data-distort (render at the untransformed CSS size, so a CSS
// transform on the canvas warps the field — Don't examples only).
import { colorwayFor, composePattern } from './pattern-renderer';
import type { Colors, StructureId } from '../data/patterns';

async function draw(canvas: HTMLCanvasElement) {
  const { structure, density, colorway, colors, rotation, zoom, panX, panY } = canvas.dataset;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = 'distort' in canvas.dataset ? { width: canvas.offsetWidth, height: canvas.offsetHeight } : canvas.getBoundingClientRect();
  const base = colorwayFor(structure as StructureId, colorway ?? 'Forest');
  await composePattern(canvas, {
    structure: structure as StructureId,
    density: Number(density),
    colors: colors ? { ...base, ...(JSON.parse(colors) as Colors) } : base,
    width: Math.max(1, Math.round(rect.width * dpr)),
    height: Math.max(1, Math.round(rect.height * dpr)),
    rotation: Number(rotation ?? 0),
    zoom: Number(zoom ?? 1),
    panX: Number(panX ?? 0),
    panY: Number(panY ?? 0),
  });
  canvas.dataset.rendered = '';
}

const io = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      io.unobserve(entry.target);
      void draw(entry.target as HTMLCanvasElement);
    }
  },
  { rootMargin: '400px 0px' },
);

document.querySelectorAll<HTMLCanvasElement>('canvas[data-pattern]').forEach((c) => io.observe(c));
