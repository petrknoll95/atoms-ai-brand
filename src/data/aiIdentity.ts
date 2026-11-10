import { colors } from './colors';
import { markBounds, slitBlades, slitClip, slitMotion } from './slitLogo';
import { thinkingPoseAt, speakingPoseAt, type SignalMotionConfig } from '../scripts/signal-engine';

/** Signal uses the existing mark-reveal construction, never a substitute logo. */
export const thinkingMotion = {
  slitCount: 6,
  duration: 2250,
  stepMs: 750,
  samples: 150,
  easing: 'linear',
} as const;
export const speakingMotion = {
  slitCount: 6,
  duration: 12000,
  samples: 480,
  easing: 'linear',
} as const;

export const aiStates = [
  { id: 'idle', name: 'Idle', label: 'Ready when you are', duration: 0, rhythm: 'Still', direction: 'At rest', description: 'The complete mark holds steady. Available, with no task in progress.', trigger: 'Enter when ready, after completion or cancellation. Never use idle to hide an error.' },
  { id: 'listening', name: 'Listening', label: 'Listening', duration: 2400, rhythm: '2.4 s · receptive', direction: 'Outside → center', description: 'A gentle intake travels from the outer blades toward the center.', trigger: 'Enter only while input capture is actually active. Leave when capture stops.' },
  { id: 'thinking', name: 'Thinking', label: 'Working on it', duration: thinkingMotion.duration, rhythm: 'Continuous outward travel', direction: 'Center → outside', description: 'Three slits on each half slide outward in a continuous loop, emerging at the center as the outer slits leave.', trigger: 'Enter after input is submitted. Continue until a result, cancellation or error; this is not a progress meter.' },
  { id: 'speaking', name: 'Speaking', label: 'Speaking', duration: speakingMotion.duration, rhythm: 'Shared irregular contractions', direction: 'Together, then release', description: 'All six slits move together through soft syllables, stronger accents and natural pauses.', trigger: 'Enter during audible output. Stop on interruption or playback end; use an output level when available.' },
] as const;
export type AIState = typeof aiStates[number]['id'];
export const aiInks = ['deepGreen', 'cream', 'black', 'white'] as const;
export type AIInk = typeof aiInks[number];
export const aiState = (id: AIState) => aiStates.find(state => state.id === id)!;
export const isAIState = (id: string): id is AIState => aiStates.some(state => state.id === id);
export const signalBlades = slitBlades();
const round = (value: number) => +value.toFixed(4);
const bounds = markBounds();
export const signalViewBox = [bounds.x, bounds.y, bounds.width, bounds.height].map(round).join(' ');

// Every state uses the same six source circles from the original mark.
export const signalChannels = signalBlades.map((blade, base) => ({ base, extra: false,
  x: blade.x, width: blade.w, tip: blade.cx + blade.direction * blade.r,
  radius: blade.r, height: Math.sqrt(blade.r ** 2 - (blade.r - blade.w) ** 2),
}));

/** Static poses remain useful in design apps and in reduced motion. */
export const signalPoses: Record<AIState, number[]> = {
  idle: [0, 0, 0, 0, 0, 0],
  listening: [.16, .16, .28, .28, .38, .38],
  thinking: [0, 0, 0, 0, 0, 0],
  speaking: [0, 0, 0, 0, 0, 0],
};

/** Shared by the live engine, standalone engine download and SVG fallbacks. */
export const signalMotion: SignalMotionConfig = {
  transitionMs: 600,
  blades: signalBlades.map(blade => ({ x: blade.x, cx: blade.cx, radius: blade.r, tip: round(blade.cx + blade.direction * blade.r), width: blade.w, direction: blade.direction, n: blade.n })),
  channels: signalChannels,
  states: {
    idle: { duration: 0, rest: signalPoses.idle, frames: [], stagger: 0 },
    listening: { duration: 2400, rest: signalPoses.listening, frames: [[0, .3], [.42, .04], [.76, .3], [1, .3]], stagger: 120 },
    thinking: { duration: thinkingMotion.duration, rest: signalPoses.thinking, frames: [], stagger: 0 },
    speaking: { duration: speakingMotion.duration, rest: signalPoses.speaking, frames: [], stagger: 0 },
  },
  thinking: {
    stepMs: thinkingMotion.stepMs,
    track: [
      { at: 0, center: signalChannels[0].tip, width: 0, radius: signalChannels[0].radius },
      ...signalChannels.filter((_, i) => i % 2 === 0).map((channel, n) => ({
        at: n + .5, center: channel.x + channel.width / 2, width: channel.width, radius: channel.radius,
      })),
      { at: 3, center: bounds.x, width: 0, radius: signalChannels[4].radius },
    ],
    duration: thinkingMotion.duration,
  },
  speaking: {
    duration: speakingMotion.duration,
    pulses: (() => {
      let seed = 0x5f3759df, cursor = 0;
      const random = () => {
        seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
        return (seed >>> 0) / 4294967296;
      };
      const pulses = [];
      let phrase = 0;
      // Group syllables into phrases: quick low-energy sounds around an accent,
      // occasional word gaps, then a longer breath before the next phrase.
      phrases: while (cursor < speakingMotion.duration) {
        cursor += phrase++ === 0 ? 100 : Math.round(260 + random() * 640);
        const syllables = 3 + Math.floor(random() * 5);
        const accent = Math.floor(random() * (syllables - 1));
        const pace = 110 + random() * 80;
        const energy = .75 + random() * .25;
        for (let syllable = 0; syllable < syllables; syllable++) {
          const at = Math.round(cursor);
          const attack = Math.round(50 + random() * 75);
          const release = Math.round(90 + random() * 185);
          const stressed = syllable === accent;
          const depth = round(.86 * (stressed ? .62 + random() * .16
            : (.08 + .46 * random() ** 1.6) * energy));
          if (at + attack + release > speakingMotion.duration - 200) break phrases;
          pulses.push({ at, attack, release, depth });
          // Short syllables overlap the previous release rather than returning
          // to a full stop between every sound.
          cursor = at + Math.round(pace * (.6 + random() * .8));
          if (syllable < syllables - 1 && random() < .18) cursor += Math.round(60 + random() * 100);
        }
        const last = pulses[pulses.length - 1];
        cursor = Math.max(cursor, last.at + last.attack + last.release);
      }
      return pulses;
    })(),
  },
};
const thinkingFrames = signalChannels.map((channel, index) => {
  const seam = (2.5 - signalBlades[channel.base].n) / 3;
  const times = Array.from({ length: thinkingMotion.samples + 1 }, (_, i) => i / thinkingMotion.samples);
  // Close the slit fully before the position resets; CSS never sweeps it backward.
  times.push(seam - .0000001);
  return times.sort((a, b) => a - b).map(at => ({ at,
    pose: thinkingPoseAt(at * thinkingMotion.duration, index, signalMotion),
  }));
});
const speakingTimes = [...new Set([
  ...Array.from({ length: speakingMotion.samples + 1 }, (_, frame) => frame / speakingMotion.samples * speakingMotion.duration),
  ...signalMotion.speaking.pulses.flatMap(pulse => [pulse.at, pulse.at + pulse.attack, pulse.at + pulse.attack + pulse.release]),
])].sort((a, b) => a - b);
const speakingFrames = signalChannels.map((_, index) => speakingTimes.map(time => ({
  at: time / speakingMotion.duration,
  pose: speakingPoseAt(time, index, signalMotion),
})));

// Reveal a circle toward its slit edge; retreat never removes an entire blade.
const travel = (index: number, amount: number) => round(-signalBlades[index].direction * signalBlades[index].w * amount);
const transform = (index: number, amount: number) => `translateX(calc(${travel(index, amount)}px * var(--signal-energy, 1)))`;

function motionCSS(uid: string, animatedState?: AIState) {
  return `#${uid} circle{transform-box:view-box;transform-origin:0px 0px;}` + aiStates.map(state => signalChannels.map((channel, index) => {
    const blade = signalBlades[channel.base];
    const root = `#${uid}[data-state="${state.id}"]`;
    const selector = `${root} .blade-${index}`;
    const pose = `transform:${transform(channel.base, signalPoses[state.id][channel.base])};`;
    if (!state.duration || (animatedState && state.id !== animatedState)) return `${selector}{${pose}}`;
    const name = `${uid}-${state.id}-${index}`;
    if (state.id === 'thinking') return `${selector}{${pose}}
#${uid}[data-animated="true"][data-state="thinking"] .blade-${index}{animation:${name} ${thinkingMotion.duration}ms linear infinite both;}
#${uid}[data-animated="true"][data-state="thinking"] .slit-${index}{animation:${name}-slit ${thinkingMotion.duration}ms linear infinite both;}
@keyframes ${name}{${thinkingFrames[index].map(({ at, pose }) => `${+(at * 100).toFixed(7)}%{transform:translate(${round(pose.x)}px, ${round(pose.y)}px) scale(${round(pose.scale)})}`).join('')}}
@keyframes ${name}-slit{${thinkingFrames[index].map(({ at, pose }) => `${+(at * 100).toFixed(7)}%{x:${round(pose.clipX)}px;width:${round(pose.clipWidth)}px}`).join('')}}`;
    if (state.id === 'speaking') return `${selector}{${pose}}
#${uid}[data-animated="true"][data-state="speaking"] .blade-${index}{animation:${name} ${speakingMotion.duration}ms linear infinite both;}
@keyframes ${name}{${speakingFrames[index].map(({ at, pose }) => `${round(at * 100)}%{transform:translateX(${round(pose.x)}px)}`).join('')}}`;
    const rank = 2 - blade.n;
    const delay = rank * signalMotion.states[state.id].stagger;
    const frames = signalMotion.states[state.id].frames;
    return `${selector}{${pose}}#${uid}[data-animated="true"][data-state="${state.id}"] .blade-${index}{animation:${name} ${state.duration}ms ${slitMotion.easing} ${delay}ms infinite both;}
@keyframes ${name}{${frames.map(([at, amount]) => `${at * 100}%{transform:${transform(channel.base, amount)}}`).join('')}}`;
  }).join('\n')).join('\n') + `
#${uid}[data-paused="true"] circle,#${uid}[data-paused="true"] clipPath rect{animation-play-state:paused!important;}
@media(prefers-reduced-motion:reduce){#${uid} circle,#${uid} clipPath rect{animation:none!important;}}
`;
}

export function signalSVG({ state = 'idle', ink = 'deepGreen', uid = 'atomsai-signal', animated = false, interactive = false, decorative = false }: {
  state?: AIState; ink?: AIInk; uid?: string; animated?: boolean; interactive?: boolean; decorative?: boolean;
} = {}) {
  // IDs supplied by components must remain valid CSS selectors and XML attributes.
  uid = `signal-${uid.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  const motion = animated || interactive;
  const accessibility = decorative ? 'aria-hidden="true"' : `role="img" aria-label="AtomsAI Signal — ${aiState(state).name}"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" id="${uid}" class="atomsai-signal" viewBox="${signalViewBox}" width="440" height="400" fill="${colors[ink].hex}" data-state="${state}" data-animated="${animated}" ${accessibility}>
${motion ? `<style>${motionCSS(uid, interactive ? undefined : state)}</style>` : ''}
<defs>${signalChannels.map((channel, i) => {
  const base = signalMotion.blades[channel.base];
  const x = state === 'speaking' ? channel.x : channel.extra ? base.x + base.width / 2 : base.x;
  const width = state === 'speaking' ? channel.width : channel.extra ? 0 : base.width;
  return `<clipPath id="${uid}-slit-${i}" clipPathUnits="userSpaceOnUse"><rect class="slit-${i}" x="${x}" y="${slitClip.y}" width="${width}" height="${slitClip.height}"/></clipPath>`;
}).join('')}</defs>
${signalChannels.map((channel, i) => {
  const blade = signalBlades[channel.base];
  return `<g clip-path="url(#${uid}-slit-${i})"><circle class="blade-${i}" cx="${round(blade.cx)}" cy="50" r="${round(blade.r)}" transform="${`translate(${travel(channel.base, signalPoses[state][channel.base])} 0)`}"/></g>`;
}).join('')}
</svg>`;
}

export const signalFileName = (state: AIState, ink: AIInk, animated = false) => `atomsai-signal-${state}-${colors[ink].token}${animated ? '-animated' : ''}.svg`;
