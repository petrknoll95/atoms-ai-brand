import { Pane, type ListBladeApi } from 'tweakpane';
import { addSteppers } from '../tweakpane';
import { copyText } from '../svg';
import { notify } from '../actions';
import { createPatternRenderer } from './renderer';
import { motionPresets, type PatternMotion } from './motion-presets';
import { irisColors } from './palettes';
import type { PatternKind, PatternOptions } from './types';

const families = { Drift: 'drift', Offset: 'offset', 'Single band': 'single-band', Concentric: 'concentric' } as const;

/** Astro adapter for the website renderer; no React runtime or shader changes. */
export function mountAnimatedPatterns(root: HTMLElement) {
  const canvas = root.querySelector<HTMLCanvasElement>('[data-motion-canvas]')!;
  const status = root.querySelector<HTMLElement>('[data-motion-status]')!;
  const note = root.querySelector<HTMLElement>('[data-motion-note]')!;
  const caption = root.querySelector<HTMLElement>('[data-motion-caption]')!;
  const code = root.querySelector<HTMLElement>('[data-motion-code]')!;
  const error = root.querySelector<HTMLElement>('[data-motion-error]')!;
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = media.matches;
  const state = { kind: 'drift' as PatternKind, palette: 'forest-dark', count: 5, motion: 'tide' as PatternMotion, duration: 12, intensity: 0.7, position: 0, still: false };
  const pane = new Pane({ container: root.querySelector<HTMLElement>('[data-motion-pane]')! });
  let renderer: ReturnType<typeof createPatternRenderer> | undefined;
  let playing = !reduced, visible = false, failed = false, lost = false;
  let phase = 0, frame = 0, previous = 0, drawnAt = 0, notifiedAt = 0, signature = '';
  let syncingFields = false;
  function refreshFields() { syncingFields = true; try { pane.refresh(); } finally { syncingFields = false; } }
  const pattern = pane.addFolder({ title: 'Pattern' });
  const motion = pane.addFolder({ title: 'Movement' });
  const transport = pane.addFolder({ title: 'Playback' });
  const reuse = pane.addFolder({ title: 'Use in the website' });
  let density: ListBladeApi<number>;
  let movement: ListBladeApi<string>;

  // Label native fields explicitly: the pane's visible labels are divs.
  function labelFields() {
    root.querySelectorAll<HTMLElement>('.tp-lblv').forEach(row => {
      const label = row.querySelector('.tp-lblv_l')?.textContent?.trim();
      if (label) row.querySelectorAll('input, select').forEach(input => input.setAttribute('aria-label', label));
    });
  }

  function bindChoices() {
    density?.dispose(); movement?.dispose();
    const counts = state.kind === 'concentric' ? [15, 29] : [1, 5, 10, 20, 40];
    density = pattern.addBlade({ view: 'list', label: state.kind === 'concentric' ? 'Rings' : 'Slits', options: counts.map(value => ({ text: String(value), value })), value: state.count }) as ListBladeApi<number>;
    density.on('change', event => { state.count = event.value; refresh(); });
    addSteppers(density, 'density');
    movement = motion.addBlade({ view: 'list', label: 'Movement', options: motionPresets.filter(p => p.id !== 'ripple' || state.kind === 'concentric').map(p => ({ text: p.name, value: p.id })), value: state.motion, index: 0 }) as ListBladeApi<string>;
    movement.on('change', event => {
      state.motion = event.value as PatternMotion;
      state.duration = preset().duration;
      phase = 0; state.position = 0; refreshFields(); refresh();
    });
    addSteppers(movement, 'movement');
    labelFields();
  }

  addSteppers(pattern.addBinding(state, 'kind', { label: 'Structure', options: families }).on('change', () => {
    state.count = state.kind === 'concentric' ? 15 : 5;
    state.motion = state.kind === 'concentric' ? 'ripple' : 'tide';
    state.duration = preset().duration; phase = 0; state.position = 0;
    bindChoices(); refreshFields(); refresh();
  }), 'structure');
  addSteppers(pattern.addBinding(state, 'palette', { label: 'Colorway', options: { 'Forest dark': 'forest-dark', 'Forest light': 'forest-light', 'Iris': 'iris' } }).on('change', () => refresh()), 'colorway');
  motion.addBinding(state, 'duration', { label: 'Loop (s)', min: 8, max: 40, step: 1 }).on('change', () => refresh());
  motion.addBinding(state, 'intensity', { label: 'Intensity', min: 0, max: 1, step: 0.05, format: v => `${Math.round(v * 100)}%` }).on('change', () => refresh());
  const play = transport.addButton({ title: playing ? 'Pause' : 'Play' }).on('click', () => {
    playing = state.still || !playing; state.still = false; refreshFields(); refresh();
  });
  const replay = transport.addButton({ title: 'Replay from start' }).on('click', () => {
    phase = 0; state.position = 0; playing = true; state.still = false; refreshFields(); refresh();
  });
  const position = transport.addBinding(state, 'position', { label: 'Loop position (%)', min: 0, max: 100, step: 0.1 }).on('change', event => {
    // Tweakpane also emits change when refreshing the displayed playback position.
    if (syncingFields) return;
    phase = event.value / 100; playing = false; refresh();
  });
  transport.addBinding(state, 'still', { label: 'Compare still' }).on('change', () => refresh());
  async function copy(value: string, message: string) {
    try { await copyText(value); notify(message); }
    catch { notify('Clipboard unavailable. Select and copy the text below the preview.'); }
  }
  reuse.addButton({ title: 'Copy component name' }).on('click', () => { void copy('MotionPattern', 'Component name copied'); });
  reuse.addButton({ title: 'Copy configured snippet' }).on('click', () => { void copy(snippet(), 'Component snippet copied'); });
  bindChoices(); labelFields();

  function preset() { return motionPresets.find(p => p.id === state.motion)!; }
  function options(): PatternOptions {
    return { kind: state.kind, count: state.count, mode: state.palette === 'forest-light' ? 'light' : 'dark', ...(state.palette === 'iris' ? { colors: irisColors[state.kind] } : {}) };
  }
  function snippet() {
    const colors = state.palette === 'iris' ? `\n  colors={${JSON.stringify(irisColors[state.kind])}}` : '';
    const freeze = !playing || reduced ? `\n  playing={false}\n  phase={${phase.toFixed(6)}}` : '';
    return `<MotionPattern\n  kind="${state.kind}"\n  count={${state.count}}\n  mode="${options().mode}"${colors}\n  motion="${state.motion}"\n  duration={${state.duration}}\n  intensity={${state.still ? 0 : state.intensity}}${freeze}\n/>`;
  }
  function running() { return playing && !reduced && !state.still && visible && !document.hidden && !failed && !lost; }
  function stop() { cancelAnimationFrame(frame); frame = 0; previous = 0; }
  function updateLabels() {
    const family = Object.entries(families).find(([, id]) => id === state.kind)![0];
    caption.textContent = `${family} · ${preset().name} · ${state.duration} s loop`;
    const label = failed || lost ? 'Preview unavailable' : reduced ? 'Reduced motion' : state.still ? 'Original still' : running() ? 'Playing' : 'Paused';
    if (status.textContent !== label) status.textContent = label;
    note.textContent = reduced ? 'Reduced motion is on. Use Loop position to inspect individual frames.' : state.palette === 'iris' ? 'Iris uses the current Iris Dark, Iris and Iris Light palette.' : 'Playback pauses when the preview is off screen.';
    play.title = playing && !state.still ? 'Pause' : 'Play';
    play.disabled = replay.disabled = reduced || failed || lost;
    canvas.setAttribute('aria-label', `${family} pattern, ${preset().name}`);
    canvas.dataset.playback = reduced ? 'reduced' : running() ? 'playing' : 'paused';
    canvas.dataset.pattern = state.kind;
    canvas.dataset.motion = state.motion;
    code.textContent = snippet();
  }
  function draw() {
    renderer?.drawMotion(preset().shader, phase, state.still ? 0 : state.intensity);
    canvas.dataset.phase = phase.toFixed(6);
    canvas.dataset.motionFrames = String(Number(canvas.dataset.motionFrames ?? 0) + 1);
  }
  function tick(now: number) {
    frame = 0;
    if (!running()) return;
    if (previous) phase = (phase + (now - previous) / (state.duration * 1000)) % 1;
    previous = now;
    if (now - drawnAt >= 1000 / 30 - 0.5) { draw(); drawnAt = now; }
    if (now - notifiedAt > 250) { state.position = phase * 100; syncingFields = true; try { position.refresh(); } finally { syncingFields = false; } notifiedAt = now; }
    frame = requestAnimationFrame(tick);
  }
  function refresh() {
    stop();
    updateLabels();
    if (!visible || document.hidden || failed || lost) return;
    const width = canvas.clientWidth, height = canvas.clientHeight;
    if (!width || !height) return;
    try {
      const settings = options();
      const next = JSON.stringify([settings, width, height, devicePixelRatio]);
      if (signature !== next) {
        renderer ??= createPatternRenderer(canvas);
        renderer.prepare(settings, width, height, devicePixelRatio);
        signature = next;
      }
      draw();
      if (running()) frame = requestAnimationFrame(tick);
    } catch (cause) {
      console.error('Animated pattern preview:', cause);
      failed = true; error.hidden = false; canvas.dataset.renderState = 'error';
      renderer?.dispose(); renderer = undefined; updateLabels();
    }
  }
  const intersection = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); refresh(); });
  const resize = new ResizeObserver(refresh);
  const changeMotion = (event: MediaQueryListEvent) => { reduced = event.matches; refresh(); };
  const lose = (event: Event) => {
    event.preventDefault(); stop(); lost = true; renderer = undefined; signature = '';
    canvas.dataset.renderState = 'lost'; error.hidden = false; updateLabels();
  };
  const restore = () => { lost = false; failed = false; error.hidden = true; refresh(); };
  canvas.addEventListener('webglcontextlost', lose);
  canvas.addEventListener('webglcontextrestored', restore);
  intersection.observe(canvas); resize.observe(canvas);
  media.addEventListener('change', changeMotion);
  document.addEventListener('visibilitychange', refresh);
  // Suspend in the back/forward cache; restore without allocating a second renderer.
  window.addEventListener('pagehide', stop);
  window.addEventListener('pageshow', refresh);
  updateLabels();
}
