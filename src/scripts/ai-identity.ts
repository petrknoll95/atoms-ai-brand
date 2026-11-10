import { aiState, isAIState, signalMotion } from '../data/aiIdentity';
import { createSignal } from './signal-engine';

const engines = new Map([...document.querySelectorAll<SVGSVGElement>('svg.atomsai-signal[data-animated="true"]')]
  .map(svg => [svg, createSignal(svg, signalMotion)]));

const demo = document.querySelector<HTMLElement>('[data-signal-demo]');
if (demo) {
  const svg = demo.querySelector<SVGSVGElement>('.atomsai-signal')!;
  const engine = engines.get(svg)!;
  const controls = [...demo.querySelectorAll<HTMLButtonElement>('[data-signal-state]')];
  controls.forEach(button => button.addEventListener('click', () => {
    const id = button.dataset.signalState!;
    if (!isAIState(id)) return;
    const state = aiState(id);
    engine.setState(id);
    demo.querySelector<HTMLElement>('[data-state-label]')!.textContent = state.label;
    controls.forEach(control => control.setAttribute('aria-pressed', String(control === button)));
  }));
}

const specimens = [...document.querySelectorAll<SVGSVGElement>('.state-art .atomsai-signal')];
document.querySelector<HTMLButtonElement>('[data-gallery-pause]')?.addEventListener('click', event => {
  const button = event.currentTarget as HTMLButtonElement;
  const paused = button.getAttribute('aria-pressed') !== 'true';
  specimens.forEach(svg => engines.get(svg)?.setPaused(paused));
  button.setAttribute('aria-pressed', String(paused));
  button.textContent = paused ? 'Resume specimens' : 'Pause specimens';
});

document.addEventListener('astro:before-swap', () => engines.forEach(engine => engine.destroy()), { once: true });
