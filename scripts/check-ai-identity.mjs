import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { unzipSync, strFromU8 } from 'fflate';
import sharp from 'sharp';

// Validate the delivered files, not a second implementation of the generator.
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const read = path => readFileSync(join(root, path));
const archive = unzipSync(read('assets/ai-identity.zip'));
assert.equal(Object.keys(archive).length, 36, '32 SVGs plus engine, HTML, JSON and guidance');
const svgNames = Object.keys(archive).filter(name => name.endsWith('.svg'));
assert.equal(svgNames.length, 32);
const stateData = JSON.parse(strFromU8(archive['states.json']));
assert.deepEqual(stateData.states.map(s => s.id), ['idle', 'listening', 'thinking', 'speaking']);
assert.equal(stateData.inks.length, 4);
const seenIds = new Set();
for (const [name, bytes] of Object.entries(archive)) {
  assert.deepEqual(read(`assets/ai-identity/${name}`), Buffer.from(bytes), `ZIP/direct parity: ${name}`);
  if (!name.endsWith('.svg')) continue;
  const svg = strFromU8(bytes);
  const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size, `Unique IDs in ${name}`);
  for (const id of ids) { assert(!seenIds.has(id), `No cross-file ID collision: ${id}`); seenIds.add(id); }
  for (const ref of svg.matchAll(/url\(#([^)]+)\)/g)) assert(ids.includes(ref[1]), `Resolved clip: ${name}`);
  assert.equal((svg.match(/<circle /g) || []).length, 6, 'Six original persistent circle shapes');
  assert(!/opacity|display:\s*none|visibility:\s*hidden/.test(svg), 'No fading or swapping shapes');
  const visible = [...svg.matchAll(/<rect\b[^>]*\bwidth="([^"]+)"[^>]*>/g)].filter(match => Number(match[1]) > 0);
  assert.equal(visible.length, 6, `Correct open slit count: ${name}`);
  assert(!/NaN|undefined|Infinity/.test(svg));
  // Circle geometry may only translate or scale uniformly; slit openings morph.
  assert(!/<ellipse\b|scale[XY]\(|skew[XY]?\(|matrix(?:3d)?\(/.test(svg), `No circle distortion: ${name}`);
  for (const group of svg.matchAll(/<g\b[^>]*>/g)) assert(!group[0].includes('transform='), `Fixed slit group: ${name}`);
  for (const match of svg.matchAll(/\bscale\(/g)) {
    let depth = 1;
    for (let i = match.index + match[0].length; depth && i < svg.length; i++) {
      const char = svg[i];
      if (char === '(') depth++;
      else if (char === ')') depth--;
      else if (depth === 1) assert(!/[,\s]/.test(char), `Uniform single-value scale: ${name}`);
    }
  }
  if (name.startsWith('static/')) {
    assert(!svg.includes('@keyframes'));
    const { data, info } = await sharp(Buffer.from(svg)).resize(440,400).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    let occupied = 0;
    for (let i=3; i<data.length; i+=info.channels) if(data[i]>0) occupied++;
    assert(occupied > 15000 && occupied < 130000, `Visible transparent vector: ${name}`);
  } else {
    assert(svg.includes('@media(prefers-reduced-motion:reduce)'));
    assert(svg.includes('animation:none!important'));
    assert(svg.includes('animation-play-state:paused!important'));
  }
}
const manifest = JSON.parse(read('assets/brand/manifest.json'));
assert.equal(manifest.assets.filter(a => a.category === 'ai-identity').length, 32);
for (const asset of manifest.assets.filter(a=>a.category==='ai-identity')) {
  const path = new URL(asset.url).pathname.replace('/atoms-ai-brand/','');
  assert(existsSync(join(root,path)), `Manifest target exists: ${path}`);
}
for (const page of ['ai-identity/index.html','assets/index.html','index.html']) {
  const html = read(page).toString();
  assert(html.includes('/atoms-ai-brand/ai-identity/'), `Discoverable from ${page}`);
  for (const [,url] of html.matchAll(/href="(\/atoms-ai-brand\/assets\/ai-identity[^"#]*)"/g)) {
    assert(existsSync(join(root,url.replace('/atoms-ai-brand/',''))), `Download exists: ${url}`);
  }
}
const html = read('ai-identity/index.html').toString();
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(ids.length, new Set(ids).size, 'No duplicate page IDs');
assert(html.includes('aria-live="polite"'));
assert(read('assets/ai-identity/signal.html').toString().includes('const signal=createSignal(svg, signalMotion)'));
assert.equal(manifest.aiIdentity.engine.endsWith('/assets/ai-identity/signal-engine.js'), true);
console.log('AI identity: 36 archive entries match direct downloads; 32 vectors, engine, transparency, unique IDs, fallback CSS, manifest and page links verified.');
