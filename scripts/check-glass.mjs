// Verify static CSS construction, contrast bounds and download parity.
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import { unzipSync, strFromU8 } from 'fflate';
const temp = await mkdtemp(join(tmpdir(), 'atomsai-glass-'));
try {
  for (const name of ['colors', 'glass']) {
    const source = await readFile(`src/data/${name}.ts`, 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText.replace("from './colors'", "from './colors.mjs'");
    await writeFile(join(temp, `${name}.mjs`), code);
  }
  const { glassCss, glassFiles, readableBackgrounds, darkReadableBackgrounds } = await import(pathToFileURL(join(temp, 'glass.mjs')));
  const { colors } = await import(pathToFileURL(join(temp, 'colors.mjs')));
  const css = glassCss();
  assert.ok(css.includes('backdrop-filter: blur(var(--glass-blur))'));
  assert.ok(css.includes('mask-composite: exclude'));
  assert.ok(css.includes('conic-gradient'));
  assert.ok(!/@keyframes|@property|:hover|:active|transform:/.test(css), 'No animated or transformed interaction states');
  for (const match of css.matchAll(/(?:animation|transition):\s*([^;]+);/g)) assert.equal(match[1], 'none');
  assert.ok(!/url\(/.test(css), 'Glass texture requires no images');
  const channels = hex => hex.slice(1).match(/../g).map(v => parseInt(v, 16));
  const luminance = values => values.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
  const reflection = channels(colors.white.hex);
  const modes = [
    { name: 'Light', backgrounds: readableBackgrounds, fill: colors.white.hex, ink: colors.deepGreen.hex, alpha: .1, steps: 200, sheenSteps: 150 },
    { name: 'Dark', backgrounds: darkReadableBackgrounds, fill: colors.black.hex, ink: colors.cream.hex, alpha: .25, steps: 150, sheenSteps: 60 },
  ];
  for (const mode of modes) for (const bg of mode.backgrounds) {
    const fill = channels(mode.fill);
    const ink = luminance(channels(mode.ink));
    let min = Infinity;
    // Independently sweep each mode's fill and white reflection through their ranges.
    for (let step = 0; step <= mode.steps; step++) for (let shine = 0; shine <= mode.sheenSteps; shine++) {
      const alpha = mode.alpha + step / 1000;
      const sheen = shine / 1000;
      const surface = luminance(channels(bg.hex).map((v, i) => Math.round((fill[i] * alpha + v * (1 - alpha)) * (1 - sheen) + reflection[i] * sheen)));
      min = Math.min(min, (Math.max(ink, surface) + .05) / (Math.min(ink, surface) + .05));
    }
    assert.ok(min >= 4.5);
    assert.ok(Math.abs(bg.ratio - min) < 1e-10);
    console.log(`${mode.name} / ${bg.name}: ${min.toFixed(4)}:1 through fill and reflection`);
  }
  if (!process.argv.includes('--source-only')) {
    const expected = glassFiles();
    const zip = unzipSync(await readFile('dist/assets/glass/atomsai-glass.zip'));
    assert.deepEqual(Object.keys(zip).sort(), Object.keys(expected).sort());
    for (const [name, content] of Object.entries(expected)) {
      assert.equal(await readFile(`dist/assets/glass/${name}`, 'utf8'), content);
      assert.equal(strFromU8(zip[name]), content);
    }
    const page = await readFile('dist/glass/index.html', 'utf8');
    const hub = await readFile('dist/assets/index.html', 'utf8');
    for (const name of [...Object.keys(zip), 'atomsai-glass.zip']) {
      assert.ok(page.includes(`/assets/glass/${name}`));
      assert.ok(hub.includes(`/assets/glass/${name}`));
    }
    assert.ok(!/<img\b/.test(page), 'Live specimens cannot be screenshot images');
    assert.ok(!/<img\b/.test(expected['examples.html']), 'Portable HTML must construct its glass');
    assert.equal((page.match(/data-glass-pattern/g) ?? []).length, 2);
    assert.ok(page.includes('atoms-glass__content'));
    const manifest = JSON.parse(await readFile('dist/assets/brand/manifest.json', 'utf8'));
    assert.equal(manifest.glass.schemaVersion, 4);
    assert.equal(manifest.glass.darkMode.className, 'atoms-glass--dark');
    assert.ok(expected['examples.html'].includes('atoms-glass--dark empty-card'));
    console.log('Static CSS surfaces, live specimens and all four download files verified.');
  }
} finally { await rm(temp, { recursive: true, force: true }); }
