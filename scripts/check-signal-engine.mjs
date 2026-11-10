import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// Exercise the actual portable module, including the exact configuration shipped.
const source = await readFile('dist/assets/ai-identity/signal-engine.js', 'utf8');
const { SignalMotion, createSignal, speakingPoseAt, signalMotion: config } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const stateData = JSON.parse(await readFile('dist/assets/ai-identity/states.json', 'utf8'));
assert.deepEqual(config, stateData.motion);
const states = ['idle', 'listening', 'thinking', 'speaking'];
const flat = pose => pose.flatMap(circle => [circle.x, circle.y, circle.scale, circle.clipX, circle.clipWidth]);
const close = (a, b, tolerance = 1e-8) => a.forEach((pose, i) => {
  if (pose.clipWidth < 1e-8 && b[i].clipWidth < 1e-8) return;
  flat([pose]).forEach((value, j) => assert(Math.abs(value - flat([b[i]])[j]) < tolerance, `${value} != ${flat([b[i]])[j]}`));
});
const geometry = pose => pose.forEach((circle, i) => {
  const channel = config.channels[i], blade = config.blades[channel.base];
  assert(Object.values(circle).every(Number.isFinite));
  assert(circle.scale > 0 && circle.scale <= 50 / blade.radius + 1e-8, 'Only uniform circle scaling');
  assert(circle.clipWidth >= 0 && circle.clipWidth <= Math.max(blade.width, ...config.channels.map(c => c.width)) + 1e-8);
  assert(!('opacity' in circle), 'Geometry transitions must never crossfade');
  // A uniformly scaled circle remains centered on y=50 after translation.
  assert(Math.abs(circle.y + 50 * circle.scale - 50) < 1e-8);
});

// Every directed state pair, including requests in the middle of an earlier blend.
for (const from of states) for (const to of states) if (from !== to) {
  const motion = new SignalMotion(config, { state: from });
  const before = motion.sample(373);
  motion.setState(to, 373);
  close(motion.sample(373), before);
  const outgoing = new SignalMotion(config, { state: from });
  close(motion.sample(373.01), outgoing.sample(373.01), 1e-8);
  for (let t = 374; t <= 900; t += 13) geometry(motion.sample(t));
  const interrupted = motion.sample(901);
  const continued = motion.sample(901.01);
  motion.setState(from, 901);
  close(motion.sample(901), interrupted);
  close(motion.sample(901.01), continued, 1e-8);
  for (let t = 902; t < 1800; t += 13) geometry(motion.sample(t));
  motion.setState('idle', 1800);
  close(motion.sample(2400), motion.rest('idle'));
  assert.equal(motion.isMoving(2400), false);
}

const rapid = new SignalMotion(config);
for (let i = 0; i < 10000; i++) rapid.setState(states[i % 4], 0);
geometry(rapid.sample(300));
for (let i = 1; i < 200; i++) {
  const time = i * 17, before = rapid.sample(time);
  rapid.setState(states[i % 4], time);
  close(rapid.sample(time), before);
  geometry(rapid.sample(time + 1));
}
rapid.setState('idle', 4000);
close(rapid.sample(4600), rapid.rest('idle'));
close(rapid.rest('thinking'), rapid.rest('idle'));
assert.equal(config.channels.length, 6);
assert.equal(rapid.rest('idle').filter(pose => pose.clipWidth > 0).length, 6);
close(rapid.rest('speaking'), rapid.rest('idle'));
geometry(rapid.rest('speaking'));
const wave = new SignalMotion(config, { state: 'thinking' });
close(wave.sample(0), wave.sample(config.thinking.duration), 1e-8);
// All three slits on each half travel outward; nodes recycle only at zero width.
const center = pose => pose.clipX + pose.clipWidth / 2;
const rendered = (poses, direction) => poses.map((pose, i) => ({
  center: center(pose), radius: pose.scale * config.blades[config.channels[i].base].radius,
  width: pose.clipWidth, direction: config.blades[config.channels[i].base].direction,
})).filter(p => p.direction === direction).sort((a, b) => a.center - b.center);
for (let time = 0; time < config.thinking.duration; time += 7) {
  const pose = wave.sample(time), next = wave.sample(time + 1);
  geometry(pose);
  pose.forEach((circle, i) => {
    const blade = config.blades[config.channels[i].base];
    if (circle.clipWidth > .001 && next[i].clipWidth > .001)
      assert((center(next[i]) - center(circle)) * blade.direction < 0, 'Visible slits always travel outward');
  });
  const left = rendered(pose, 1), right = rendered(pose, -1).reverse();
  assert.equal(left.length, 3); assert.equal(right.length, 3);
  left.forEach((slit, i) => {
    assert(Math.abs(slit.center + right[i].center - 100) < 1e-8, 'Exactly two mirrored halves');
    assert(Math.abs(slit.width - right[i].width) < 1e-8);
    assert(Math.abs(slit.radius - right[i].radius) < 1e-8);
  });
}
for (const direction of [1, -1]) {
  const a = rendered(wave.sample(137), direction), b = rendered(wave.sample(137 + config.thinking.stepMs), direction);
  a.forEach((slit, i) => ['center','radius','width'].forEach(key => assert(Math.abs(slit[key] - b[i][key]) < 1e-8, 'Visible loop is seamless')));
}
for (let pair = 0; pair < 3; pair++) {
  const seam = (2.5 - pair) * config.thinking.stepMs;
  assert(wave.sample(seam)[pair * 2].clipWidth < 1e-8, 'Recycling slit is completely closed');
  for (const target of states.filter(s => s !== 'thinking')) {
    const outgoing = new SignalMotion(config, {state:'thinking'});
    outgoing.setState(target, seam - 200);
    close(outgoing.sample(seam - .00001), outgoing.sample(seam + .00001), .0001);
    const incoming = new SignalMotion(config, {state:target});
    incoming.setState('thinking', 0, config.thinking.duration + 600);
    close(incoming.sample(seam - .00001), incoming.sample(seam + .00001), .0001);
  }
}
// Speaking retains the original slots; a shared contraction drives all six slits.
const speech = new SignalMotion(config, {state:'speaking'});
close(speech.sample(0), speech.sample(config.speaking.duration));
const ranges = config.blades.map(() => []);
let resting = 0;
for (let time = 0; time < config.speaking.duration; time += 31) {
  const poses = speech.sample(time);
  geometry(poses);
  poses.forEach((pose, i) => {
    const blade = config.blades[i];
    assert.equal(pose.scale, 1); assert.equal(pose.y, 0);
    assert.equal(pose.clipX, blade.x); assert.equal(pose.clipWidth, blade.width);
    assert(pose.x * blade.direction <= 0 && Math.abs(pose.x) <= blade.width * .8);
    ranges[i].push(Math.abs(pose.x) / blade.width);
  });
  const contraction = Math.abs(poses[0].x) / config.blades[0].width;
  poses.forEach((pose, i) => assert(Math.abs(Math.abs(pose.x) / config.blades[i].width - contraction) < 1e-12, 'Every slit contracts at the same time'));
  if (contraction === 0) resting++;
}
assert(resting > 50, 'Irregular pauses between shared contractions');
const intervals = config.speaking.pulses.slice(1).map((p, i) => p.at - config.speaking.pulses[i].at);
assert(new Set(intervals).size > 5, 'Contraction times are irregular');
assert(Math.min(...intervals) < 160 && Math.max(...intervals) > 650, 'Quick syllables and longer phrase pauses');
const depths = config.speaking.pulses.map(p => p.depth);
assert(Math.min(...depths) < .2 && Math.max(...depths) > .55 && Math.max(...depths) > 5 * Math.min(...depths), 'Quiet syllables contrast with strong accents');
const overlapping = config.speaking.pulses.slice(1).filter((p, i) => p.at < config.speaking.pulses[i].at + config.speaking.pulses[i].attack + config.speaking.pulses[i].release);
assert(overlapping.length > 5, 'Speech phrases connect syllables rather than stopping after every beat');
for (const pulse of config.speaking.pulses) {
  for (const time of [pulse.at, pulse.at + pulse.attack, pulse.at + pulse.attack + pulse.release])
    close(speech.sample(time - .00001), speech.sample(time + .00001), .0001);
}
ranges.forEach(values => assert(Math.max(...values) - Math.min(...values) > .4, 'Every speaking slit covers the shared expressive range'));
assert.throws(() => rapid.setState('unknown', 5000), TypeError);
assert.throws(() => rapid.setState('speaking', 5000, NaN), RangeError);
assert.throws(() => new SignalMotion(config, { transitionMs: -1 }), RangeError);
rapid.setState('speaking', 5000, 0);
assert.equal(rapid.state, 'speaking');
rapid.setLevels({ output: 0, input: 2 }, 5000);
close(rapid.sample(5120), config.channels.map((_, i) => speakingPoseAt(120, i, config, 0)));
rapid.setLevels({ output: 1 }, 5120);
geometry(rapid.sample(5180));
assert.throws(() => rapid.setLevels({ output: NaN }, 5200), RangeError);

// A small deterministic browser host verifies frame ownership and lifecycle.
const frames = new Map(), events = new Map();
let frameId = 0, now = 0, intersection;
globalThis.requestAnimationFrame = callback => { frames.set(++frameId, callback); return frameId; };
globalThis.cancelAnimationFrame = id => frames.delete(id);
globalThis.document = {
  hidden: false,
  addEventListener: (name, callback) => events.set(name, callback),
  removeEventListener: name => events.delete(name),
};
const media = { matches: false, addEventListener: (_, callback) => { media.changed = callback; }, removeEventListener: () => { delete media.changed; } };
globalThis.matchMedia = () => media;
globalThis.IntersectionObserver = class {
  constructor(callback) { intersection = callback; }
  observe() {}
  disconnect() { intersection = null; }
};
globalThis.getComputedStyle = () => ({ transform: 'none' });
globalThis.DOMMatrixReadOnly = class { constructor() { this.a = 1; this.e = 0; this.f = 0; } };
const circles = Array.from({ length: config.channels.length }, (_, index) => ({
  index,
  style: { setProperty(name, value) { this[name] = value; } },
  getAttribute: () => null,
  removeAttribute(name) { if (name === 'style') this.style = {}; },
}));
const clips = config.channels.map(channel => {
  const base = config.blades[channel.base];
  return {
    values: {x: String(channel.extra ? base.x + base.width / 2 : base.x), width: String(channel.extra ? 0 : base.width)},
    style: {setProperty(name, value) {this[name] = value;}},
    getAttribute(name) { return this.values[name] ?? null; },
    setAttribute(name, value) { this.values[name] = value; },
    removeAttribute(name) {if (name === 'style') this.style = {};},
  };
});
const originalClips = JSON.stringify(clips.map(clip => clip.values));
const svg = {
  dataset: { state: 'idle' },
  querySelectorAll: selector => selector === 'circle' ? circles : clips,
  getAttribute: name => name === 'data-motion-engine' ? svg.dataset.motionEngine ?? null : null,
};
const run = (milliseconds = 16) => {
  now += milliseconds;
  const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(now));
};
const transforms = () => circles.map((circle, i) => [circle.style.transform, clips[i].style.x, clips[i].style.width]);
const assertLogo = () => {
  assert(circles.every(circle => circle.style.transform === 'translate(0px, 0px) scale(1)' && !('opacity' in circle.style)));
  assert.equal(clips.filter(clip => parseFloat(clip.style.width) > 0).length, 6);
};
const controller = createSignal(svg, config);
assert.throws(() => createSignal(svg, config), /already/);
for (let i = 0; i < 60; i++) run();
assert.equal(frames.size, 0, 'Idle stops requesting frames');
controller.setState('speaking');
for (let i = 0; i < 30; i++) run();
const poseBeforeSwitch = transforms();
controller.setState('thinking');
assert.deepEqual(transforms(), poseBeforeSwitch, 'Retargeting does not move the rendered frame');
controller.setPaused(true);
assert.equal(frames.size, 0);
const paused = transforms();
run(30000);
controller.setPaused(false);
run();
assert.deepEqual(transforms(), paused, 'Resuming does not catch up wall-clock time');
run();
assert.notDeepEqual(transforms(), paused);
document.hidden = true; events.get('visibilitychange')();
assert.equal(frames.size, 0);
const hidden = transforms(); run(30000);
document.hidden = false; events.get('visibilitychange')(); run();
assert.deepEqual(transforms(), hidden);
intersection([{ isIntersecting: false }]);
assert.equal(frames.size, 0);
intersection([{ isIntersecting: true }]);
assert.equal(frames.size, 1);
media.matches = true; media.changed();
assert.equal(frames.size, 0);
controller.setState('speaking');
const stillSpeaking = transforms();
controller.setState('thinking');
assertLogo();
controller.setState('speaking');
assert.deepEqual(transforms(), stillSpeaking);
media.matches = false; media.changed(); run();
assert.deepEqual(transforms(), stillSpeaking, 'Leaving reduced motion starts at the still pose');
controller.setPaused(true); controller.setState('idle');
assertLogo();
controller.setPaused(false);
controller.destroy(); controller.destroy();
assert.equal(frames.size, 0);
assert.equal(events.size, 0);
assert.equal(intersection, null);
assert.equal(media.changed, undefined);
assert.equal(svg.dataset.motionEngine, undefined);
assert.equal(JSON.stringify(clips.map(clip => clip.values)), originalClips);
assert(circles.every(circle => Object.keys(circle.style).length === 0));
assert(clips.every(clip => Object.keys(clip.style).length === 0));
console.log('Signal engine: original six-slit mark, outward Thinking, synchronized Speaking with irregular pauses, seamless recycling, no crossfade, all 12 transitions, interruptions, circular geometry, audio levels, pause/resume, visibility, reduced motion and cleanup verified.');
