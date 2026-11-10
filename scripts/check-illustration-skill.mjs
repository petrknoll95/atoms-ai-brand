// Exercise the actual downloadable kit in an isolated folder without repository imports.
// Run after npm run build. This is a reproducibility check, not a visual-quality score.
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const temp = await mkdtemp(join(tmpdir(), 'atomsai-skill-install-'));
try {
  const archive = unzipSync(await readFile(join(root, 'dist/skills/atomsai-skills.zip')));
  for (const [name, bytes] of Object.entries(archive)) {
    assert(!name.startsWith('/') && !name.split('/').includes('..'));
    if (!name.startsWith('atomsai-illustrations/')) continue;
    const path = join(temp, name);
    await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
  }
  const kit = join(temp, 'atomsai-illustrations');
  const manifest = JSON.parse(await readFile(join(kit, 'assets/reference-manifest.json')));
  const page = await readFile(join(root, 'src/pages/illustration.astro'), 'utf8');
  assert.deepEqual(manifest.gallery, [...page.matchAll(/\{ slug: '([^']+)', title:/g)].map(match => match[1]), 'Kit must follow actual gallery registration');
  const { CAMERA } = await import(pathToFileURL(join(kit, 'runtime/geometry.mjs')));
  assert.equal(CAMERA.iris, manifest.palette.iris);
  assert.equal(CAMERA.hiddenOpacity, .35);
  for (const recipe of ['planes', 'rings']) {
    const out = join(temp, `${recipe}-proof`);
    execFileSync(process.execPath, [join(kit, 'scripts/render.mjs'), '--recipe', join(kit, `recipes/${recipe}.mjs`), '--out', out], { cwd: temp, stdio: 'pipe' });
    const report = JSON.parse(await readFile(join(out, 'report.json')));
    assert.equal(report.mechanicalChecks, 'passed');
    assert.equal(report.conceptChecks, 'recipe assertions passed');
    assert.equal(report.views.length, 8);
    assert.deepEqual(report.palette, manifest.palette);
    assert(report.visualReview.startsWith('required'), 'Mechanical checks must not claim visual approval');
    assert.equal(recipe === 'rings' ? report.primitiveCounts['hollow-cylinder'] : report.primitiveCounts.plane, 3);
    if (recipe === 'rings') assert(report.views.every(view => view.hiddenRuns === 0));
    else assert(report.views.some(view => view.hiddenRuns > 0), 'Translucent sheets should expose consistent hidden linework');
    for (const view of report.views) {
      const svg = await readFile(join(out, view.file), 'utf8');
      assert(svg.includes('viewBox="0 0 384 384"'));
      assert(!/<(?:image|script|foreignObject)\b/.test(svg));
      assert(!/\b(?:NaN|Infinity)\b/.test(svg));
      const ids = [...svg.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
      assert.equal(new Set(ids).size, ids.length);
      const ink = view.file.includes('-dark') ? manifest.palette.light : manifest.palette.dark;
      assert(svg.includes(`stroke="${ink}"`));
    }
    const sheet = await readFile(join(out, 'contact-sheet.svg'), 'utf8');
    const ids = [...sheet.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
    assert.equal(new Set(ids).size, ids.length, 'Comparison sheet must namespace embedded gradients');
  }
  // Tampering cannot quietly fork the visual system inside an installed skill.
  await writeFile(join(kit, 'runtime/geometry.mjs'), (await readFile(join(kit, 'runtime/geometry.mjs'), 'utf8')).replace('#A77BCA', '#FF0000'));
  assert.throws(() => execFileSync(process.execPath, [join(kit, 'scripts/render.mjs'), '--existing', 'layers', '--out', join(temp, 'bad')], { cwd: temp, stdio: 'pipe' }), /Runtime drift/);
  console.log('Verified installed ZIP without repository imports: 2 construction recipes, 16 views, shared palette/framing, opaque/translucent modes, unique IDs and runtime drift rejection.');
} finally { await rm(temp, { recursive: true, force: true }); }
