// Shared engine for the dot-field tools (point cloud, concentric dots): a p5 canvas that projects
// dots placed in 3D with perspective and draws them as flat 2D dots in the theme's foreground
// color, plus drag-to-orbit, the H key and the shared Render / Motion settings.
//
// Each tool supplies `build` (where the dots go) and its own settings folders. A `flat` tool is
// drawn face-on and orthographic, and only repaints when a setting changes.

import p5 from 'p5';
import { Pane, type FolderApi } from 'tweakpane';
import { colors, themes } from '../data/colors';
import { addSteppers } from './tweakpane';

/** Brand themes (background + foreground) plus a black and white mono option. */
export const THEMES: Record<string, { bg: string; fg: string }> = {};
for (const theme of themes) {
  for (const step of theme.steps) THEMES[`${theme.name} ${step.label}`] = { bg: colors[step.bg].hex, fg: colors[step.fg].hex };
}
THEMES.Mono = { bg: colors.black.hex, fg: colors.white.hex };

export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export interface DotCloud {
  /** x, y, z per dot. */
  positions: Float32Array;
  /** A fixed random in [-1, 1] per dot, scaled by the size variance at draw time. */
  sizeJitter: Float32Array;
  count: number;
  /** Characteristic radius of the cloud, used to frame it and to normalise depth. */
  radius: number;
}

/** Settings every dot-field tool shares (Render and Motion folders). */
export type ViewSettings = {
  theme: string;
  dot: number;
  variance: number;
  depthFade: number;
  perspective: number;
  zoom: number;
  rotate: boolean;
  speed: number;
  tilt: number;
};

export const VIEW_DEFAULTS: ViewSettings = {
  theme: 'Forest Dark',
  dot: 1.4,
  variance: 0.4,
  depthFade: 0.5,
  perspective: 3,
  zoom: 1,
  rotate: !reducedMotion,
  speed: 0.06,
  tilt: 0.18,
};

export const percent = (v: number) => `${Math.round(v * 100)}%`;

interface Options<S extends ViewSettings, C extends DotCloud> {
  stage: HTMLElement;
  paneHost: HTMLElement;
  title: string;
  /** Download name, without extension. */
  fileName: (state: S) => string;
  defaults: S;
  /** Starting rotation around the vertical axis, in radians. */
  yaw?: number;
  /**
   * A static, face-on view: orthographic (no perspective), no orbit or rotation, no depth fade.
   * The canvas redraws only when a setting changes.
   */
  flat?: boolean;
  build: (p: p5, state: S) => C;
  /** Adds the tool's own folders, above Render and Motion. */
  controls: (pane: Pane, state: S, api: { rebuild: () => void; addStats: (folder: FolderApi) => void }) => void;
}

export function mountDotField<S extends ViewSettings, C extends DotCloud>(o: Options<S, C>) {
  const state = { ...o.defaults };
  const stats = { dots: 0, ms: 0 };
  let cloud: C | null = null;
  let dirty = true;
  let yaw = o.yaw ?? 0;
  let pitchOffset = 0;
  let dragging = false;
  // A flat view doesn't loop, so every change asks for one new frame.
  let instance: p5 | null = null;
  const requestFrame = () => {
    if (o.flat) instance?.redraw();
  };
  const rebuild = () => {
    dirty = true;
    requestFrame();
  };

  const applyTheme = () => {
    const t = THEMES[state.theme];
    document.documentElement.style.setProperty('--canvas-bg', t.bg);
    document.documentElement.style.setProperty('--canvas-fg', t.fg);
  };
  applyTheme();

  /**
   * Projects the cloud into a w × h view. Dots are grouped by opacity (depth bands in 3D, a single
   * group when flat) as x, y, size triples of top-left squares. The canvas and the SVG export both
   * draw from this, so a copied SVG matches the screen.
   */
  const project = (w: number, h: number): { opacity: number; rects: number[] }[] => {
    if (!cloud) return [];
    const { positions, sizeJitter, count, radius } = cloud;
    const cx = w / 2;
    const cy = h / 2;
    const scale = (Math.min(w, h) * 0.5 * state.zoom) / radius;
    const inView = (sx: number, sy: number) => sx >= -4 && sx <= w + 4 && sy >= -4 && sy <= h + 4;

    // Flat: orthographic and face-on, one group at full opacity.
    if (o.flat) {
      const rects: number[] = [];
      for (let i = 0, j = 0; i < count; i++, j += 3) {
        const sx = cx + positions[j] * scale;
        const sy = cy - positions[j + 1] * scale;
        if (!inView(sx, sy)) continue;
        const size = state.dot * (1 + sizeJitter[i] * state.variance);
        rects.push(sx - size / 2, sy - size / 2, size);
      }
      return [{ opacity: 1, rects }];
    }

    const pitch = state.tilt + pitchOffset;
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw);
    const cosX = Math.cos(pitch), sinX = Math.sin(pitch);
    const D = state.perspective;

    // Depth bands, so a whole cloud is a handful of fills (and paths in the SVG).
    const BANDS = 8;
    const bands = Array.from({ length: BANDS }, (_, b) => ({ opacity: 1 - (state.depthFade * (b + 0.5)) / BANDS, rects: [] as number[] }));
    for (let i = 0, j = 0; i < count; i++, j += 3) {
      const x = positions[j], y = positions[j + 1], z = positions[j + 2];
      const x1 = x * cosY + z * sinY;
      const z1 = -x * sinY + z * cosY;
      const y2 = y * cosX - z1 * sinX;
      const z2 = y * sinX + z1 * cosX;
      const depth = z2 / radius;
      const denom = D + depth;
      if (denom <= 0.05) continue;
      const k = (D / denom) * scale;
      const sx = cx + x1 * k;
      const sy = cy + y2 * k;
      if (!inView(sx, sy)) continue;
      const size = state.dot * (1 + sizeJitter[i] * state.variance);
      const band = Math.min(BANDS - 1, Math.max(0, Math.floor(((depth + 1) / 2) * BANDS)));
      bands[band].rects.push(sx - size / 2, sy - size / 2, size);
    }
    return bands;
  };

  /** The current view as SVG: a background rect, then one path of squares per opacity group. */
  const toSvg = () => {
    const w = o.stage.clientWidth;
    const h = o.stage.clientHeight;
    const theme = THEMES[state.theme];
    const n = (v: number) => String(Math.round(v * 100) / 100);
    const paths = project(w, h)
      .filter((band) => band.rects.length)
      .map((band) => {
        const r = band.rects;
        let d = '';
        for (let i = 0; i < r.length; i += 3) d += `M${n(r[i])} ${n(r[i + 1])}h${n(r[i + 2])}v${n(r[i + 2])}h-${n(r[i + 2])}z`;
        const opacity = band.opacity < 1 ? ` fill-opacity="${n(band.opacity)}"` : '';
        return `<path d="${d}" fill="${theme.fg}"${opacity}/>`;
      });
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
      `<rect width="${w}" height="${h}" fill="${theme.bg}"/>`,
      ...paths,
      '</svg>',
    ].join('\n');
  };

  instance = new p5((p: p5) => {
    p.setup = () => {
      p.createCanvas(o.stage.clientWidth, o.stage.clientHeight);
      p.pixelDensity(Math.min(2, window.devicePixelRatio || 1));
      if (o.flat) p.noLoop();
    };

    p.windowResized = () => {
      p.resizeCanvas(o.stage.clientWidth, o.stage.clientHeight);
      requestFrame();
    };

    p.draw = () => {
      if (dirty || !cloud) {
        const t0 = performance.now();
        cloud = o.build(p, state);
        stats.ms = Math.round(performance.now() - t0);
        stats.dots = cloud.count;
        dirty = false;
      }
      if (!o.flat && state.rotate && !dragging) yaw += (state.speed * p.deltaTime) / 1000;

      const theme = THEMES[state.theme];
      p.background(theme.bg);
      const ctx = p.drawingContext as CanvasRenderingContext2D;
      ctx.fillStyle = theme.fg;
      for (const band of project(p.width, p.height)) {
        const path = new Path2D();
        const r = band.rects;
        for (let i = 0; i < r.length; i += 3) path.rect(r[i], r[i + 1], r[i + 2], r[i + 2]);
        ctx.globalAlpha = band.opacity;
        ctx.fill(path);
      }
      ctx.globalAlpha = 1;
    };
  }, o.stage);

  // Drag to orbit (pointer events on the stage, so the panel never steals or triggers a drag).
  if (!o.flat) {
    let last = { x: 0, y: 0 };
    o.stage.addEventListener('pointerdown', (e) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      o.stage.setPointerCapture(e.pointerId);
    });
    o.stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      yaw += (e.clientX - last.x) * 0.006;
      pitchOffset = Math.max(-1.4, Math.min(1.4, pitchOffset + (e.clientY - last.y) * 0.006));
      last = { x: e.clientX, y: e.clientY };
    });
    const end = () => (dragging = false);
    o.stage.addEventListener('pointerup', end);
    o.stage.addEventListener('pointercancel', end);
  }

  // H shows or hides the panel.
  document.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 'h' || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.target instanceof HTMLElement && e.target.closest('input, select, textarea')) return;
    o.paneHost.hidden = !o.paneHost.hidden;
  });

  // ---------- Settings ----------
  const pane = new Pane({ container: o.paneHost, title: o.title });
  const addStats = (folder: FolderApi) => {
    folder.addBinding(stats, 'dots', { label: 'Dots', readonly: true, format: (v) => Math.round(v).toLocaleString('en-US') });
    folder.addBinding(stats, 'ms', { label: 'Build (ms)', readonly: true, format: (v) => `${Math.round(v)}` });
  };
  o.controls(pane, state, { rebuild, addStats });

  const render = pane.addFolder({ title: 'Render' });
  const themeBinding = render.addBinding(state, 'theme', { label: 'Theme', options: Object.fromEntries(Object.keys(THEMES).map((k) => [k, k])) });
  themeBinding.on('change', applyTheme);
  addSteppers(themeBinding, 'theme');
  render.addBinding(state, 'dot', { label: 'Dot size', min: 0.5, max: 6, step: 0.1, format: (v) => `${v.toFixed(1)} px` });
  render.addBinding(state, 'variance', { label: 'Size variance', min: 0, max: 1, step: 0.01, format: percent });
  if (!o.flat) {
    render.addBinding(state, 'depthFade', { label: 'Depth fade', min: 0, max: 0.95, step: 0.01, format: percent });
    render.addBinding(state, 'perspective', { label: 'Perspective', min: 1.2, max: 12, step: 0.1 });
  }
  render.addBinding(state, 'zoom', { label: 'Zoom', min: 0.3, max: 3, step: 0.01, format: percent });

  if (!o.flat) {
    const motion = pane.addFolder({ title: 'Motion' });
    motion.addBinding(state, 'rotate', { label: 'Auto-rotate' });
    motion.addBinding(state, 'speed', { label: 'Speed', min: -0.6, max: 0.6, step: 0.01 });
    motion.addBinding(state, 'tilt', { label: 'Tilt', min: -1.5, max: 1.5, step: 0.01 });
  }

  // Any setting change repaints a flat (non-looping) view.
  pane.on('change', requestFrame);

  const copy = pane.addButton({ title: 'Copy SVG' });
  copy.on('click', async () => {
    try {
      await navigator.clipboard.writeText(toSvg());
      copy.title = 'Copied';
    } catch {
      copy.title = 'Copy failed';
    }
    window.setTimeout(() => (copy.title = 'Copy SVG'), 1600);
  });
  pane.addButton({ title: 'Download PNG' }).on('click', () => instance?.saveCanvas(o.fileName(state), 'png'));
  pane.addButton({ title: 'Reset' }).on('click', () => {
    Object.assign(state, o.defaults);
    yaw = o.yaw ?? 0;
    pitchOffset = 0;
    pane.refresh();
    applyTheme();
    rebuild();
  });

  return { state, pane, rebuild };
}
