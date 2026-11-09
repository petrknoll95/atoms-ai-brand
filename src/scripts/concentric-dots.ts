// Concentric dots: rings of small dots, drawn flat and face-on by the shared dot-field engine.
//
// Each ring gets dots spaced evenly along its circumference (so outer rings are as dense as inner
// ones). A noise effector bends the rings radially, so they read as a slightly irregular field
// radiating from one point, like the brand's Concentric pattern. The view is static and
// orthographic: no animation, no perspective.

import type p5 from 'p5';
import { mountDotField, percent, VIEW_DEFAULTS, type DotCloud } from './dot-field';

const DEFAULTS = {
  ...VIEW_DEFAULTS,
  // Rings
  seed: 2101,
  rings: 15,
  inner: 0.21,
  curve: 2.4,
  gap: 0.008,
  dropout: 0.6,
  thickness: 0.007,
  jitter: 0,
  // Noise effector
  frequency: 0.2,
  octaves: 1,
  warp: 0.3,
  // Render
  dot: 1.4,
  variance: 0,
  zoom: 1.19,
};
type State = typeof DEFAULTS;

function build(p: p5, s: State): DotCloud {
  p.randomSeed(s.seed);
  p.noiseSeed(s.seed);
  p.noiseDetail(s.octaves, 0.5);
  const f = s.frequency;
  const pos: number[] = [];

  for (let i = 0; i < s.rings; i++) {
    const t = s.rings === 1 ? 1 : i / (s.rings - 1);
    const r = s.inner + (1 - s.inner) * Math.pow(t, s.curve);
    const n = Math.max(6, Math.round((Math.PI * 2 * r) / s.gap));
    const phase = p.random(Math.PI * 2);
    for (let k = 0; k < n; k++) {
      if (p.random() < s.dropout) continue;
      const a = phase + (k / n) * Math.PI * 2 + p.randomGaussian(0, s.jitter) / Math.max(r, 0.02);
      const cx = Math.cos(a) * r;
      const cy = Math.sin(a) * r;
      // Noise effector, sampled where the dot sits, bends the ring radially.
      const dr = (p.noise(cx * f + 17.3, cy * f + 17.3, 3.1) - 0.5) * 2 * s.warp + p.randomGaussian(0, s.thickness);
      pos.push(Math.cos(a) * (r + dr), Math.sin(a) * (r + dr), 0);
    }
  }

  const count = pos.length / 3;
  const sizeJitter = new Float32Array(count);
  for (let i = 0; i < count; i++) sizeJitter[i] = p.random(-1, 1);
  return { positions: Float32Array.from(pos), sizeJitter, count, radius: 1.05 };
}

export function mountConcentricDots(stage: HTMLElement, paneHost: HTMLElement) {
  mountDotField({
    stage,
    paneHost,
    title: 'Concentric dots',
    fileName: (s) => `atomsai-concentric-dots-${s.seed}`,
    defaults: DEFAULTS,
    flat: true,
    build,
    controls: (pane, state, { rebuild, addStats }) => {
      const rings = pane.addFolder({ title: 'Rings' });
      const regen = [
        rings.addBinding(state, 'rings', { label: 'Rings', min: 1, max: 120, step: 1 }),
        rings.addBinding(state, 'inner', { label: 'Inner radius', min: 0, max: 0.8, step: 0.01, format: percent }),
        rings.addBinding(state, 'curve', { label: 'Spacing curve', min: 0.3, max: 3, step: 0.05 }),
        rings.addBinding(state, 'gap', { label: 'Dot spacing', min: 0.002, max: 0.05, step: 0.001 }),
        rings.addBinding(state, 'dropout', { label: 'Dropout', min: 0, max: 0.95, step: 0.01, format: percent }),
        rings.addBinding(state, 'thickness', { label: 'Thickness', min: 0, max: 0.03, step: 0.001 }),
        rings.addBinding(state, 'jitter', { label: 'Jitter', min: 0, max: 0.02, step: 0.001 }),
        rings.addBinding(state, 'seed', { label: 'Seed', min: 1, max: 9999, step: 1 }),
      ];
      rings.addButton({ title: 'New seed' }).on('click', () => {
        state.seed = 1 + Math.floor(Math.random() * 9999);
        pane.refresh();
        rebuild();
      });
      addStats(rings);

      const noise = pane.addFolder({ title: 'Noise effector' });
      regen.push(
        noise.addBinding(state, 'frequency', { label: 'Frequency', min: 0.2, max: 8, step: 0.05 }),
        noise.addBinding(state, 'octaves', { label: 'Octaves', min: 1, max: 6, step: 1 }),
        noise.addBinding(state, 'warp', { label: 'Warp', min: 0, max: 0.3, step: 0.005 }),
      );
      for (const binding of regen) binding.on('change', rebuild);
    },
  });
}
