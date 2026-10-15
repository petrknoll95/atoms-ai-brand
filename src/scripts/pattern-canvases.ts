// Renders every <canvas data-pattern> on the page once it scrolls into view.
import { colorwayFor, composePattern } from './pattern-renderer';
import type { StructureId } from '../data/patterns';

async function draw(canvas: HTMLCanvasElement) {
  const { structure, density, colorway, rotation, zoom } = canvas.dataset;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  await composePattern(canvas, {
    structure: structure as StructureId,
    density: Number(density),
    colors: colorwayFor(structure as StructureId, colorway ?? 'Forest'),
    width: Math.max(1, Math.round(rect.width * dpr)),
    height: Math.max(1, Math.round(rect.height * dpr)),
    rotation: Number(rotation ?? 0),
    zoom: Number(zoom ?? 1),
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
