import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { unzipSync } from 'fflate';
import { logoFiles, logoVariants } from '../src/data/logoExports.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/logos');
const manifest = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8'));
assert.equal(logoFiles.length, 128);
assert.equal(manifest.files.length, logoFiles.length);
assert.deepEqual(manifest.files.map((file) => `/logos/${file.path}`).sort(), logoFiles.map((file) => file.file).sort());
const diskFiles = (await readdir(output, { recursive: true })).filter((file) => /\.(svg|png|jpg|webp)$/.test(file));
assert.equal(diskFiles.length, logoFiles.length, 'Unexpected or missing logo exports');

for (const file of manifest.files) {
  const data = await readFile(join(output, file.path));
  assert.equal(data.length, file.bytes, file.filename);
  assert.equal(createHash('sha256').update(data).digest('hex'), file.sha256, file.filename);
  const variant = logoVariants.find((variant) => variant.id === file.variant);
  const master = await readFile(join(root, 'src/assets/brand/logo', variant.source), 'utf8');
  if (file.format === 'svg') {
    assert.equal(data.toString(), master.replaceAll('currentColor', file.ink), 'SVG must preserve master geometry');
    continue;
  }
  const metadata = await sharp(data).metadata();
  assert.equal(metadata.format, file.format === 'jpg' ? 'jpeg' : file.format);
  assert.equal(metadata.width, file.width, file.filename);
  assert.equal(metadata.height, file.height, file.filename);
  assert.equal(metadata.hasAlpha, file.transparent, file.filename);
  assert.equal(metadata.space, 'srgb', file.filename);
  if (file.format !== 'webp') assert.equal(metadata.density, 300, file.filename);
  const { data: pixels, info } = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const ink = file.ink.slice(1).match(/../g).map((c) => parseInt(c, 16));
  if (file.transparent) {
    let clear = 0, solid = 0, antialiased = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3];
      if (alpha === 0) clear++;
      else if (alpha === 255) {
        solid++;
        assert(ink.every((value, channel) => value === pixels[i + channel]), `Wrong solid ink: ${file.filename}`);
      } else antialiased++;
    }
    assert(clear > 0 && solid > 0 && antialiased > 0, `Missing transparency/artwork/antialiasing: ${file.filename}`);
    if (file.format === 'webp') {
      const png = await sharp(join(output, file.path.replace('/webp/', '/png/').replace(/\.webp$/, '.png'))).ensureAlpha().raw().toBuffer();
      assert.equal(png.length, pixels.length);
      for (let i = 0; i < pixels.length; i += 4) {
        assert.equal(pixels[i + 3], png[i + 3], `Lossless alpha differs: ${file.filename}`);
        if (pixels[i + 3]) assert(pixels.subarray(i, i + 3).equals(png.subarray(i, i + 3)), `Lossless color differs: ${file.filename}`);
      }
    }
  } else {
    const background = file.background.slice(1).match(/../g).map((c) => parseInt(c, 16));
    // JPG compression can round color channels by 1; check four corners and all four edge midpoints.
    for (const [x, y] of [[0, 0], [info.width - 1, 0], [0, info.height - 1], [info.width - 1, info.height - 1], [Math.floor(info.width / 2), 0], [Math.floor(info.width / 2), info.height - 1], [0, Math.floor(info.height / 2)], [info.width - 1, Math.floor(info.height / 2)]]) {
      const offset = (y * info.width + x) * 4;
      assert(background.every((value, channel) => Math.abs(value - pixels[offset + channel]) <= 2), `Wrong JPG background or clipped margin: ${file.filename}`);
    }
  }
}

// Run after the site build to also check every ZIP entry and published manifest target.
if (process.argv.includes('--built')) {
  for (const variant of [null, ...logoVariants.map((variant) => variant.id)]) {
    const path = variant ? `assets/logos/${variant}.zip` : 'assets/logos.zip';
    const zip = unzipSync(await readFile(join(root, 'dist', path)));
    const expected = manifest.files.filter((file) => !variant || file.variant === variant);
    assert.equal(Object.keys(zip).length, expected.length + 2, `Wrong ZIP contents: ${path}`);
    const zipManifest = JSON.parse(new TextDecoder().decode(zip['manifest.json']));
    assert.equal(zipManifest.files.length, expected.length);
    for (const file of expected) {
      assert(Buffer.from(zip[file.path]).equals(await readFile(join(output, file.path))), `ZIP payload differs: ${file.filename}`);
    }
  }
  const published = JSON.parse(await readFile(join(root, 'dist/assets/brand/manifest.json'), 'utf8'));
  assert.equal(published.assets.filter((file) => file.url.includes('/logos/')).length, manifest.files.length);
}
console.log(`Verified ${manifest.files.length} logo files: master fidelity, sizes, sRGB, transparency, lossless WEBP parity and JPG backgrounds${process.argv.includes('--built') ? ', plus all three ZIPs' : ''}.`);
