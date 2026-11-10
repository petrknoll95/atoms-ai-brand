import { strToU8, zipSync } from 'fflate';
import { aiInks, aiStates, signalFileName, signalSVG, thinkingMotion, speakingMotion, signalMotion } from './aiIdentity';
import { colors } from './colors';
import ts from 'typescript';
import engineSource from '../scripts/signal-engine.ts?raw';

const engineJavaScript = ts.transpileModule(engineSource, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022, removeComments: false } }).outputText;
export const signalEngineJavaScript = engineJavaScript + `\nexport const signalMotion = ${JSON.stringify(signalMotion)};\n`;

export const signalGuide = `# AtomsAI Signal

Signal is the functional AI expression of the AtomsAI mark: three mirrored pairs of circular blades. All four states use the original six-slit construction. Thinking moves the three slits on each half continuously outward. Speaking contracts all six slits together within the original openings, with irregular timing and varied strength. Preserve the mark's circular cuts, inward-facing tips, taper and overall proportions. Never substitute equalizer bars, stretch a circle or scale a clipped blade on one axis. Do not rotate the element or add glow. Use the original logo for brand signatures.

## States

${aiStates.map(state => `### ${state.name}\n\n${state.description}\n\nLabel: ${state.label}. Motion: ${state.rhythm}; ${state.direction}.\n\n${state.trigger}`).join('\n\n')}

## Usage

- Forest first: Deep green (${colors.deepGreen.hex}) on Cream (${colors.cream.hex}), or the inverse. Black and White are provided for monochrome. State is expressed by motion and a label, never by color alone.
- Preferred animated width: 64–160 CSS px. Minimum: 48 px. Below 48 px use the complete idle shape with a state label. Scale the whole element uniformly. All animated source circles must also retain equal horizontal and vertical scale; clip them only after their uniform scaling and translation. Keep at least half the element width of clear space horizontally and half its height vertically, as for the mark.
- Use one active Signal per conversation. An avatar, message composer or voice session is appropriate; decoration across a page is not.
- Idle is still. Listening requires active input capture. Thinking means work is pending, not a percentage. Speaking requires actual playback; streaming text alone stays Thinking until complete.
- A voice interaction normally follows Idle → Listening → Thinking → Speaking → Idle. Text input may skip Listening and Speaking. Interruptions can return directly to Listening; cancellation returns to Idle. Errors need a separate visible error message and recovery action, with motion stopped.
- Switch state when the underlying event changes. Keep the fixed viewport to avoid layout shift. Do not wait for a loop to finish, add a mandatory delay or announce every animation cycle.
- Include an adjacent visible status label (role=status, aria-live=polite, aria-atomic=true). Hide the inline decorative SVG from assistive technology. Announce only state changes. Keep microphone, mute, stop and retry as separately labeled controls.
- Animated SVGs honor prefers-reduced-motion with a still pose and accompanying state label. Thinking rests in the complete base logo, including its static and reduced-motion versions. Static SVGs are supplied for design tools and constrained clients. Provide a pause option for persistent demos; never force motion back on when reduced motion is requested.
- All SVGs are transparent, editable vectors in sRGB. Standalone SVGs use CSS loops; the interactive reference uses the JavaScript motion engine for smooth state transitions. Design tools may import the fallback pose only. Static imports contain explicit geometry transforms and no animation.

## Files

static/: four state poses in Deep green, Cream, Black and White (16 SVGs).
animated/: matching self-contained SVGs (16 SVGs; Idle intentionally stays still).
signal.html: a self-contained reference with state, theme and pause controls, no dependencies or network calls. This is a simulated demonstration and never activates a microphone.
signal-engine.js: a dependency-free ES module containing the animation engine and shared motion configuration.
states.json: motion timing, triggers and labels.

## Integration

Use static SVGs as images or paste an animated SVG inline. For dynamic state switching, mount the engine on an inline Signal SVG:

\`\`\`js
import { createSignal, signalMotion } from './signal-engine.js';
const signal = createSignal(document.querySelector('svg.atomsai-signal'), signalMotion);
signal.setState('listening');
signal.setState('thinking');
signal.setState('speaking');
signal.setState('idle');
// Optional: signal.setPaused(true); signal.setPaused(false);
// Optional: signal.setLevels({ input: 0.5, output: 0.8 });
// On unmount: signal.destroy();
\`\`\`

Transitions interpolate geometry over 600 ms. The same six circle elements persist in every state, always fully opaque. Circle positions and uniform scales interpolate together with slit positions and widths. Closed slits contribute no spatial weight during a transition, keeping their return to the center invisible. There is no crossfade, extra slit, shape replacement or opacity animation. Quintic easing preserves continuity at interruptions and handoffs. Each incoming state begins its own cadence; Thinking starts from the complete logo. Use { transitionMs: 900 } as the third createSignal argument to adjust the default, or signal.setState('idle', 400) for one change. A duration of 0 requests an immediate change. Repeating the current state does not restart it.

Update the adjacent label when requesting the state, not after its visual transition. The engine pauses its clock offscreen, when the tab is hidden or when explicitly paused, and stops requesting frames once Idle settles. State changes while paused show the target still pose; resuming blends into its motion. Reduced motion shows the target still pose immediately. destroy() removes observers, listeners and animation frames and restores the SVG's original styles. The engine owns circle transforms and slit geometry while mounted; use its API instead of switching data-state or CSS animation properties directly. The standalone HTML embeds this exact engine and works offline.

For live audio, signal.setLevels accepts normalized input and output values, clamps them to 0–1 and smooths changes over 120 ms. Input drives Listening; output drives Speaking. The CSS variables below are for standalone SVG loops without the engine.

For Listening, --signal-energy accepts a normalized value from 0 to 1 and scales horizontal blade retreat: use 1 - smoothedInputLevel. Thinking keeps three slits on each mirrored half moving continuously outward, advancing one position every 750 ms. Each persistent circle completes the track in 2.25 seconds; the visible arrangement repeats every 750 ms. A slit closes fully at the outer edge before returning to the center and opening again. Smooth spatial interpolation preserves the mark's taper and circular cuts. Speaking retains the original fixed slit openings and circle sizes. All six circles retreat and return together using one shared envelope. The seeded cadence groups short, soft syllables around stronger accents, with occasional word gaps and longer phrase pauses. Syllables vary widely in depth, attack and release; overlapping releases blend smoothly without forcing the mark back to rest after every sound. The demonstration repeats seamlessly after 12 seconds. Keep mirrored partners and all three pairs synchronized; vary when a contraction occurs and its strength, not the timing of individual slits. Output levels can adjust the speaking retreat through signal.setLevels. Standalone SVGs use these same motions. Static and reduced-motion Thinking and Speaking use the complete base mark.

Multiple inline copies need unique SVG, clipPath and keyframe IDs; retain each file's unique IDs or namespace them. Do not place identical inline files in the same document without namespacing. The site component does this automatically.
`;

export function signalDemo() {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>AtomsAI Signal</title><style>
*{box-sizing:border-box}body{margin:0;padding:clamp(24px,6vw,80px);background:${colors.cream.hex};color:${colors.deepGreen.hex};font:16px/1.5 system-ui,sans-serif}main{max-width:960px;margin:auto}h1{font-size:48px;font-weight:400;letter-spacing:-.04em;margin:0 0 12px}p{max-width:620px}.stage{display:grid;place-items:center;min-height:440px;background:${colors.deepGreen.hex};color:${colors.cream.hex};margin:36px 0 24px;padding:clamp(24px,4vw,48px)}.stage svg{width:min(132px,50%);height:auto;max-width:100%;fill:currentColor}.stage.light{background:${colors.cream.hex};color:${colors.deepGreen.hex};outline:1px solid currentColor}.controls{display:flex;gap:8px;flex-wrap:wrap}button{font:inherit;background:transparent;color:inherit;border:1px solid currentColor;border-radius:99px;padding:8px 18px;cursor:pointer}button[aria-pressed=true]{background:${colors.deepGreen.hex};color:${colors.cream.hex}}button:focus-visible{outline:3px solid currentColor;outline-offset:3px}small{display:block;margin-top:24px}#label{margin:60px 0 0}.stage>div{display:grid;justify-items:center;width:100%}
</style></head><body><main><h1>AtomsAI Signal.</h1><p>One recognizable form. Four ways to show what the AI is doing.</p><div class="stage"><div>${signalSVG({ uid: 'reference', ink: 'cream', interactive: true, animated: true, decorative: true })}<p id="label" role="status" aria-live="polite" aria-atomic="true">Ready when you are</p></div></div><div class="controls" role="group" aria-label="Preview state">${aiStates.map(state => `<button type="button" data-state="${state.id}" aria-pressed="${state.id === 'idle'}">${state.name}</button>`).join('')}</div><div class="controls" style="margin-top:16px"><button type="button" id="pause" aria-pressed="false">Pause motion</button><button type="button" id="theme" aria-pressed="false">Light surface</button></div><small>Simulated states. No microphone or audio playback. Reduced motion uses still poses.</small></main><script type="module">
${signalEngineJavaScript}
const labels=${JSON.stringify(Object.fromEntries(aiStates.map(state => [state.id, state.label])))};
const svg=document.querySelector('svg');
const signal=createSignal(svg, signalMotion);
document.querySelectorAll('button[data-state]').forEach(button=>button.addEventListener('click',()=>{signal.setState(button.dataset.state);document.getElementById('label').textContent=labels[button.dataset.state];document.querySelectorAll('button[data-state]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
document.getElementById('pause').addEventListener('click',event=>{const b=event.currentTarget;const paused=b.getAttribute('aria-pressed')!=='true';signal.setPaused(paused);b.setAttribute('aria-pressed',String(paused));b.textContent=paused?'Resume motion':'Pause motion';});
document.getElementById('theme').addEventListener('click',event=>{const light=document.querySelector('.stage').classList.toggle('light');event.currentTarget.setAttribute('aria-pressed',String(light));});
</script></body></html>`;
}

export function signalFiles(): Record<string, string> {
  const files: Record<string, string> = {};
  for (const state of aiStates) for (const ink of aiInks) for (const animated of [false, true]) {
    const name = signalFileName(state.id, ink, animated);
    files[`${animated ? 'animated' : 'static'}/${name}`] = signalSVG({ state: state.id, ink, animated, uid: name.replace('.svg', '') });
  }
  files['README.md'] = signalGuide;
  files['states.json'] = JSON.stringify({ name: 'AtomsAI Signal', version: 16, motion: signalMotion, thinkingMotion, speakingMotion, minimumAnimatedWidth: 48, preferredWidth: [64, 160], easing: 'cubic-bezier(0.7, 0, 0.3, 1)', inks: aiInks.map(ink => colors[ink]), states: aiStates }, null, 2) + '\n';
  files['signal-engine.js'] = signalEngineJavaScript;
  files['signal.html'] = signalDemo();
  return files;
}

export const signalArchive = () => zipSync(Object.fromEntries(Object.entries(signalFiles()).map(([path, body]) => [path, strToU8(body)])), { level: 9 });
