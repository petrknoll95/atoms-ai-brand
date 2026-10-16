// The animated mark outside SMIL: a canvas renderer for video export, and a one-shot cycle for
// inline SVGs (the sidebar logo on hover). Timing and geometry come from src/data/slitLogo.ts.
import { concealment, markBounds, slitBlades, slitClip, slitMotion } from '../data/slitLogo';

const blades = slitBlades();
const bounds = markBounds();

interface FrameOptions {
  width: number;
  height: number;
  /** Mark width in pixels; the mark is centered. */
  markWidth: number;
  fg: string;
  bg: string;
}

/** Draws the mark at a point in its cycle (0–1). */
export function drawMark(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, phase: number, o: FrameOptions) {
  ctx.fillStyle = o.bg;
  ctx.fillRect(0, 0, o.width, o.height);
  const scale = o.markWidth / bounds.width;
  ctx.save();
  ctx.translate(o.width / 2 - (bounds.x + bounds.width / 2) * scale, o.height / 2 - (bounds.y + bounds.height / 2) * scale);
  ctx.scale(scale, scale);
  ctx.fillStyle = o.fg;
  for (const b of blades) {
    const offset = concealment(phase - b.stagger);
    ctx.save();
    ctx.beginPath();
    ctx.rect(b.x, slitClip.y, b.w, slitClip.height);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(b.cx - b.direction * b.distance * offset, 50, b.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

interface VideoOptions {
  width: number;
  height: number;
  fg: string;
  bg: string;
  /** Mark width as a share of the video width (0–1). */
  logo: number;
  /** Number of 4 s cycles. */
  loops?: number;
  onProgress?: (done: number) => void;
}

/**
 * Renders the animation frame by frame and encodes it in the browser: H.264 MP4 where supported,
 * VP9 WebM otherwise. 60 fps up to 1080p, 30 fps above.
 */
export async function exportMarkVideo({ width, height, fg, bg, logo, loops = 1, onProgress }: VideoOptions) {
  const { BufferTarget, CanvasSource, Mp4OutputFormat, Output, QUALITY_HIGH, WebMOutputFormat, getFirstEncodableVideoCodec } =
    await import('mediabunny');
  const codec = await getFirstEncodableVideoCodec(['avc', 'vp9'], { width, height });
  if (!codec) throw new Error('This browser can’t encode video.');
  const mp4 = codec === 'avc';
  const fps = Math.max(width, height) > 1920 ? 30 : 60;

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  const output = new Output({ format: mp4 ? new Mp4OutputFormat() : new WebMOutputFormat(), target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec, quality: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: fps });
  await output.start();

  const frames = Math.round(slitMotion.seconds * loops * fps);
  const markWidth = width * logo;
  for (let i = 0; i < frames; i++) {
    const seconds = i / fps;
    drawMark(ctx, (seconds / slitMotion.seconds) % 1, { width, height, markWidth, fg, bg });
    await source.add(seconds, 1 / fps);
    onProgress?.((i + 1) / frames);
  }
  await output.finalize();
  return {
    blob: new Blob([output.target.buffer!], { type: mp4 ? 'video/mp4' : 'video/webm' }),
    extension: mp4 ? 'mp4' : 'webm',
  };
}

/**
 * Plays one cycle on an inline slit SVG whose circles carry data-cx, data-direction, data-distance
 * and data-stagger. It starts where the circles begin to retreat, so the motion follows the trigger
 * at once. Resolves when the mark is whole again.
 */
export function playCycle(svg: SVGSVGElement) {
  const circles = [...svg.querySelectorAll<SVGCircleElement>('circle[data-cx]')].map((node) => ({
    node,
    cx: Number(node.dataset.cx),
    direction: Number(node.dataset.direction),
    distance: Number(node.dataset.distance),
    stagger: Number(node.dataset.stagger),
  }));
  const start = slitMotion.hide[0];
  const duration = (1 - start) * slitMotion.seconds * 1000;
  return new Promise<void>((resolve) => {
    const t0 = performance.now();
    const frame = (now: number) => {
      const progress = Math.min(1, (now - t0) / duration);
      const phase = start + progress * (1 - start);
      for (const c of circles) {
        c.node.setAttribute('cx', String(c.cx - c.direction * c.distance * concealment(phase - c.stagger)));
      }
      if (progress < 1) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });
}
