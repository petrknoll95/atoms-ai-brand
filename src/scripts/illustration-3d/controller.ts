import { makeScene } from './models';
import { projectScene, frameToSvg, type ProjectedFrame, type View } from './render';
import { drawFrame } from './canvas';
import { createAnimator, type Animator } from './motion';

/** Loops paint at up to 60 fps, even on faster displays. */
const LOOP_FRAME_MS = 1000 / 60;
/**
 * Every playing loop shares one paint budget per display frame. Past it, a loop waits a frame,
 * so a screen full of loops drops to every other frame rather than missing frames.
 */
const BUDGET_MS = 8;
const shared = { frame: -1, spent: 0 };

// Each visited preview owns a p5 instance. Only the active/changed preview draws, plus any
// motion loop that is playing on screen.
export async function initIllustrations() {
  const { default: P5 } = await import('p5');
  const cleanup: (() => void)[] = [];
  const visibility = new Map<Element, (visible: boolean) => void>();
  const onScreen = new Map<Element, (visible: boolean) => void>();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) visibility.get(entry.target)?.(entry.isIntersecting);
  }, { rootMargin: '160px' });
  // Loops play only while their card is actually in view; mounting happens a little earlier.
  const screen = new IntersectionObserver(entries => {
    for (const entry of entries) onScreen.get(entry.target)?.(entry.isIntersecting);
  });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

  for (const wrapper of document.querySelectorAll<HTMLElement>('[data-illustration-3d]')) {
    if (wrapper.dataset.initialized) continue;
    wrapper.dataset.initialized = 'true';
    const card = wrapper.querySelector<HTMLElement>('[data-asset]')!;
    const preview = card.querySelector<HTMLElement>('[data-asset-preview]')!;
    const resetButton = wrapper.querySelector<HTMLButtonElement>('[data-view-reset]')!;
    const motionButton = wrapper.querySelector<HTMLButtonElement>('[data-motion-toggle]');
    const status = wrapper.querySelector<HTMLElement>('[data-view-status]')!;
    const slug = wrapper.getAttribute('data-illustration-3d')!;
    const name = wrapper.dataset.name ?? slug;
    const events = new AbortController();
    const view: View = { yaw: 0, pitch: 0, white: false };
    let scene: ReturnType<typeof makeScene> | undefined;
    let animator: Animator | undefined;
    let frame: ProjectedFrame | undefined, frameSource: ReturnType<typeof makeScene> | undefined;
    let dirty = true, disposed = false, visible = false, inView = false;
    let instance: any, canvas: HTMLCanvasElement | undefined, resizeObserver: ResizeObserver | undefined;
    let raf = 0, reportPending = false;
    let start: { x: number; y: number; yaw: number; pitch: number } | undefined;
    // Motion: loop time 0–1. Reduced motion starts paused on the still; a person can still play it.
    let playing = !!motionButton && !reducedMotion.matches, chosen = false, phase = 0;
    let loopRaf = 0, clock = 0, loopPaint = 0, paintedAt = 0, cost = 2, waited = false;
    const timings: number[] = [];
    let paintCount = 0, exportCount = 0;

    function rest() {
      scene ??= makeScene(slug);
      if (motionButton) animator ??= createAnimator(slug, scene);
      return scene;
    }
    /** Playing, or paused mid-loop: draw the loop frame with the fit of the whole loop. */
    function inMotion() { return !!animator && (playing || phase !== 0); }
    /** The model to draw: the loop frame while in motion, otherwise the still. */
    function source() {
      const still = rest();
      return inMotion() ? animator!.scene(phase) : still;
    }
    function currentFrame() {
      const model = source();
      if (!frame || dirty || model !== frameSource) {
        frame = inMotion() ? projectScene(model, view, { extent: animator!.extent(view) }) : projectScene(model, view);
        frameSource = model; dirty = false;
      }
      return frame;
    }
    function report() {
      status.textContent = `Rotation ${Math.round(view.yaw * 180 / Math.PI)}°, ${Math.round(view.pitch * 180 / Math.PI)}°`;
      wrapper.dataset.yaw = String(view.yaw); wrapper.dataset.pitch = String(view.pitch);
      // Development-only measurements; no telemetry or UI changes during a drag.
      if (import.meta.env.DEV) {
        const sorted = [...timings].sort((a, b) => a - b);
        wrapper.dataset.previewStats = JSON.stringify({
          frames: paintCount, exports: exportCount,
          medianMs: sorted[Math.floor(sorted.length * .5)] ?? 0,
          p95Ms: sorted[Math.floor(sorted.length * .95)] ?? 0,
        });
      }
    }
    function queue(reportAfter = false) {
      reportPending ||= reportAfter;
      if (raf || disposed || !visible || document.hidden || !instance) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        if (!disposed && visible && !document.hidden) instance.redraw();
      });
    }
    function changed(reportAfter = false) {
      dirty = true;
      const yawFromDefault = Math.atan2(Math.sin(view.yaw), Math.cos(view.yaw));
      resetButton.hidden = Math.abs(yawFromDefault) < 1e-6 && Math.abs(view.pitch) < 1e-6;
      queue(reportAfter);
    }
    function running() { return !!animator && playing && visible && inView && !document.hidden && !disposed && !!instance; }
    function tick(now: number) {
      loopRaf = 0;
      if (!running()) { clock = 0; return; }
      if (clock) phase = (phase + (now - clock) / (animator!.seconds * 1000)) % 1;
      clock = now;
      // Holds (the same frame object) are never repainted, nor is a frame a drag already painted.
      if (paintedAt < now && now - loopPaint >= LOOP_FRAME_MS - 2 && (dirty || source() !== frameSource)) {
        if (shared.frame !== now) { shared.frame = now; shared.spent = 0; }
        if (waited || shared.spent === 0 || shared.spent + cost <= BUDGET_MS) {
          shared.spent += cost; waited = false; loopPaint = now;
          instance.redraw();
        } else waited = true;
      }
      loopRaf = requestAnimationFrame(tick);
    }
    function sync() {
      if (running()) { if (!loopRaf) loopRaf = requestAnimationFrame(tick); }
      else { cancelAnimationFrame(loopRaf); loopRaf = 0; clock = 0; }
    }
    function showMotion() {
      if (!motionButton) return;
      motionButton.dataset.state = playing ? 'playing' : 'paused';
      motionButton.setAttribute('aria-label', `${playing ? 'Pause' : 'Play'} ${name} animation`);
      wrapper.dataset.motion = playing ? 'playing' : 'paused';
    }
    function mount() {
      if (instance || disposed) return;
      rest();
      instance = new P5((p: any) => {
        p.setup = () => {
          if (disposed) return;
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          const renderer = p.createCanvas(1, 1);
          preview.innerHTML = ''; preview.removeAttribute('role'); preview.removeAttribute('aria-label');
          renderer.parent(preview); canvas = renderer.elt;
          canvas!.tabIndex = 0;
          canvas!.setAttribute('aria-label', `${slug} 3D preview`);
          p.noLoop();
          const fit = (width: number, height: number) => {
            const nominal = parseFloat(getComputedStyle(preview).getPropertyValue('--art-w')) * 1.5 * Math.max(1, 1 / (scene!.frameAspect ?? 1));
            const size = Math.max(1, Math.round(Math.min(width, height, nominal || width)));
            if (p.width !== size) {
              preview.style.setProperty('--canvas-size', `${size}px`);
              p.resizeCanvas(size, size, true);
              queue();
            }
          };
          resizeObserver = new ResizeObserver(entries => {
            const { width, height } = entries[0].contentRect;
            fit(width, height);
          });
          resizeObserver.observe(preview);
          const bounds = preview.getBoundingClientRect(); fit(bounds.width, bounds.height);
          queue(true);
          sync();
        };
        p.draw = () => {
          if (disposed || !visible || document.hidden) return;
          const began = performance.now();
          drawFrame(p.drawingContext, currentFrame());
          paintedAt = performance.now();
          cost = cost * .8 + (paintedAt - began) * .2;
          paintCount++;
          if (import.meta.env.DEV) {
            timings.push(performance.now() - began);
            if (timings.length > 180) timings.shift();
            wrapper.dataset.phase = phase.toFixed(4);
          }
          if (reportPending) { reportPending = false; report(); }
        };
      });
    }
    const up = () => {
      if (!start) return;
      start = undefined; preview.classList.remove('is-dragging'); queue(true);
    };
    preview.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      start = { x: e.clientX, y: e.clientY, yaw: view.yaw, pitch: view.pitch };
      preview.setPointerCapture(e.pointerId); preview.classList.add('is-dragging');
    }, { signal: events.signal });
    preview.addEventListener('pointermove', e => {
      if (!start) return;
      const yaw = start.yaw + (e.clientX - start.x) * .009;
      const pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, start.pitch + (e.clientY - start.y) * .009));
      if (yaw === view.yaw && pitch === view.pitch) return;
      view.yaw = yaw; view.pitch = pitch; changed();
    }, { signal: events.signal, passive: true });
    preview.addEventListener('pointerup', up, { signal: events.signal });
    preview.addEventListener('pointercancel', up, { signal: events.signal });
    preview.addEventListener('lostpointercapture', up, { signal: events.signal });
    preview.addEventListener('keydown', e => {
      if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Home') { view.yaw = 0; view.pitch = 0; }
      else {
        view.yaw += (e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0) * Math.PI / 36;
        view.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, view.pitch + (e.key === 'ArrowDown' ? 1 : e.key === 'ArrowUp' ? -1 : 0) * Math.PI / 36));
      }
      changed(true);
    }, { signal: events.signal });
    resetButton.addEventListener('click', () => {
      view.yaw = 0; view.pitch = 0; changed(true);
    }, { signal: events.signal });
    motionButton?.addEventListener('click', () => {
      playing = !playing; chosen = true;
      showMotion(); sync();
      status.textContent = playing ? 'Animation playing' : 'Animation paused';
      if (!playing) { dirty = true; queue(); }
    }, { signal: events.signal });
    // Follow a reduced-motion change unless the person has chosen play or pause themselves.
    reducedMotion.addEventListener('change', () => {
      if (!motionButton || chosen) return;
      playing = !reducedMotion.matches;
      if (!playing) phase = 0;
      showMotion(); sync(); dirty = true; queue();
    }, { signal: events.signal });
    card.addEventListener('change', () => {
      view.white = !!card.querySelector('input[data-asset-color="light"]:checked'); dirty = true;
      queue(true);
    }, { signal: events.signal });
    // Export synchronously from the latest orientation, even before a queued paint. A playing
    // loop exports the still; a paused loop exports the frame on screen.
    card.addEventListener('asset:prepare-export', () => {
      const still = rest();
      card.dataset.currentSvg = frameToSvg(animator && !playing && phase !== 0 ? currentFrame() : projectScene(still, view));
      exportCount++; report();
    }, { signal: events.signal });
    if (import.meta.env.DEV) {
      // Inspect a loop without relying on requestAnimationFrame (hidden previews pause it).
      wrapper.addEventListener('illustration:seek', ((e: CustomEvent<number>) => {
        playing = false; chosen = true; phase = ((e.detail % 1) + 1) % 1;
        showMotion(); sync(); dirty = true; instance?.redraw();
      }) as EventListener, { signal: events.signal });
    }
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0; up(); }
      else queue();
      sync();
    }, { signal: events.signal });
    visibility.set(wrapper, isVisible => {
      visible = isVisible;
      if (visible) { mount(); queue(); }
      else { cancelAnimationFrame(raf); raf = 0; up(); }
      sync();
    });
    onScreen.set(wrapper, isOnScreen => { inView = isOnScreen; sync(); });
    showMotion();
    observer.observe(wrapper);
    screen.observe(wrapper);
    cleanup.push(() => {
      disposed = true; events.abort(); resizeObserver?.disconnect();
      cancelAnimationFrame(raf); cancelAnimationFrame(loopRaf); instance?.remove();
    });
  }
  document.addEventListener('astro:before-swap', () => {
    observer.disconnect(); screen.disconnect(); cleanup.forEach(dispose => dispose());
  }, { once: true });
}
