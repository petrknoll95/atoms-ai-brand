// Point cloud: dots placed in 3D by a noise flow field, drawn by the shared dot-field engine.
//
// Walkers start in a Gaussian cluster and follow a 3D noise field (the effector), dropping dots as
// they go. That leaves filaments and streaks rather than a uniform blob; a light pull to the centre
// keeps the cluster together, and a few scattered dots fill the space around it.

import type p5 from 'p5';
import { mountDotField, percent, VIEW_DEFAULTS, type DotCloud } from './dot-field';

const DEFAULTS = {
  ...VIEW_DEFAULTS,
  // Distribution
  seed: 7,
  walkers: 600,
  steps: 140,
  density: 0.55,
  spread: 0.3,
  stretch: 2.4,
  scatter: 0.025,
  // Noise effector
  scale: 1.2,
  octaves: 3,
  steer: 0.3,
  step: 0.012,
  gravity: 0.1,
  jitter: 0.003,
  // Render
  variance: 0.45,
};
type State = typeof DEFAULTS;

function build(p: p5, s: State): DotCloud {
  p.randomSeed(s.seed);
  p.noiseSeed(s.seed);
  p.noiseDetail(s.octaves, 0.5);
  const f = s.scale;
  const out: number[] = [];

  for (let w = 0; w < s.walkers; w++) {
    let x = p.randomGaussian(0, s.spread * s.stretch);
    let y = p.randomGaussian(0, s.spread);
    let z = p.randomGaussian(0, s.spread);
    let vx = 0, vy = 0, vz = 0;
    for (let i = 0; i < s.steps; i++) {
      // Flow direction from three decorrelated noise samples; x is weighted by the stretch so
      // the walkers favour long horizontal streaks.
      const fx = (p.noise(x * f + 31.7, y * f, z * f) - 0.5) * s.stretch;
      const fy = p.noise(x * f, y * f + 57.3, z * f) - 0.5;
      const fz = p.noise(x * f, y * f, z * f + 83.9) - 0.5;
      const len = Math.hypot(fx, fy, fz) || 1;
      vx += ((fx / len) * s.step - vx) * s.steer - x * s.gravity * s.step;
      vy += ((fy / len) * s.step - vy) * s.steer - y * s.gravity * s.step;
      vz += ((fz / len) * s.step - vz) * s.steer - z * s.gravity * s.step;
      x += vx;
      y += vy;
      z += vz;
      if (p.random() < s.density) {
        out.push(x + p.randomGaussian(0, s.jitter), y + p.randomGaussian(0, s.jitter), z + p.randomGaussian(0, s.jitter));
      }
    }
  }

  let sum = 0;
  const trail = out.length / 3;
  for (let i = 0; i < out.length; i += 3) sum += out[i] ** 2 + out[i + 1] ** 2 + out[i + 2] ** 2;
  const radius = Math.max(0.05, Math.sqrt(sum / Math.max(1, trail)) * 2);

  // Sparse scatter in a wider ellipsoid around the cluster.
  const extra = Math.round(trail * s.scatter);
  for (let i = 0; i < extra; i++) {
    let a, b, c;
    do {
      a = p.random(-1, 1);
      b = p.random(-1, 1);
      c = p.random(-1, 1);
    } while (a * a + b * b + c * c > 1);
    out.push(a * radius * 1.5, b * radius, c * radius);
  }

  const count = out.length / 3;
  const sizeJitter = new Float32Array(count);
  for (let i = 0; i < count; i++) sizeJitter[i] = p.random(-1, 1);
  return { positions: Float32Array.from(out), sizeJitter, count, radius };
}

export function mountPointCloud(stage: HTMLElement, paneHost: HTMLElement) {
  mountDotField({
    stage,
    paneHost,
    title: 'Point cloud',
    fileName: (s) => `atomsai-point-cloud-${s.seed}`,
    defaults: DEFAULTS,
    yaw: 0.6,
    build,
    controls: (pane, state, { rebuild, addStats }) => {
      const dist = pane.addFolder({ title: 'Distribution' });
      const regen = [
        dist.addBinding(state, 'walkers', { label: 'Walkers', min: 100, max: 4000, step: 50 }),
        dist.addBinding(state, 'steps', { label: 'Steps', min: 10, max: 200, step: 1 }),
        dist.addBinding(state, 'density', { label: 'Dot density', min: 0.1, max: 1, step: 0.01, format: percent }),
        dist.addBinding(state, 'spread', { label: 'Spread', min: 0.05, max: 1, step: 0.01 }),
        dist.addBinding(state, 'stretch', { label: 'Stretch X', min: 0.5, max: 4, step: 0.05 }),
        dist.addBinding(state, 'scatter', { label: 'Scatter', min: 0, max: 0.5, step: 0.01, format: percent }),
        dist.addBinding(state, 'seed', { label: 'Seed', min: 1, max: 9999, step: 1 }),
      ];
      dist.addButton({ title: 'New seed' }).on('click', () => {
        state.seed = 1 + Math.floor(Math.random() * 9999);
        pane.refresh();
        rebuild();
      });
      addStats(dist);

      const noise = pane.addFolder({ title: 'Noise effector' });
      regen.push(
        noise.addBinding(state, 'scale', { label: 'Frequency', min: 0.2, max: 6, step: 0.05 }),
        noise.addBinding(state, 'octaves', { label: 'Octaves', min: 1, max: 6, step: 1 }),
        noise.addBinding(state, 'steer', { label: 'Follow', min: 0.01, max: 1, step: 0.01 }),
        noise.addBinding(state, 'step', { label: 'Step length', min: 0.002, max: 0.06, step: 0.001 }),
        noise.addBinding(state, 'gravity', { label: 'Pull to centre', min: 0, max: 2, step: 0.01 }),
        noise.addBinding(state, 'jitter', { label: 'Jitter', min: 0, max: 0.05, step: 0.001 }),
      );
      for (const binding of regen) binding.on('change', rebuild);
    },
  });
}
