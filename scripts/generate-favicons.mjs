// Regenerate the favicon bitmaps from the approved SVG: node scripts/generate-favicons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { colors } from '../src/data/colors.ts';

const publicFile = (name) => new URL(`../public/${name}`, import.meta.url);
const mark = await readFile(new URL('../src/assets/brand/logo/mark.svg', import.meta.url), 'utf8');
const path = mark.match(/<path\b[^>]*d="([^"]+)"/)?.[1];
if (!path) throw new Error('The master mark must contain its path.');
const background = colors.deepGreen.hex;
const variants = [
  { prefix: 'favicon', ink: colors.cream.hex, background },
  { prefix: 'favicon-transparent-deep-green', ink: colors.deepGreen.hex },
  { prefix: 'favicon-transparent-cream', ink: colors.cream.hex },
];

// ICO stores uncompressed 32-bit DIB frames for broad compatibility, including an AND mask.
function icoFrame(rgba, size) {
  const maskStride = Math.ceil(size / 32) * 4;
  const frame = Buffer.alloc(40 + size * size * 4 + maskStride * size);
  frame.writeUInt32LE(40, 0);
  frame.writeInt32LE(size, 4);
  frame.writeInt32LE(size * 2, 8);
  frame.writeUInt16LE(1, 12);
  frame.writeUInt16LE(32, 14);
  frame.writeUInt32LE(size * size * 4 + maskStride * size, 20);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const source = (y * size + x) * 4;
      const target = 40 + ((size - 1 - y) * size + x) * 4;
      frame[target] = rgba[source + 2];
      frame[target + 1] = rgba[source + 1];
      frame[target + 2] = rgba[source];
      frame[target + 3] = rgba[source + 3];
      if (rgba[source + 3] === 0) {
        frame[40 + size * size * 4 + (size - 1 - y) * maskStride + (x >> 3)] |= 0x80 >> (x & 7);
      }
    }
  }
  return frame;
}

for (const variant of variants) {
  // Transparent: full canvas width, original 440:400 mark centered in a square.
  // Background: preserve the app-icon rule of a 60% mark, on a full-bleed solid square.
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 440 440">${variant.background ? `<rect width="440" height="440" fill="${variant.background}"/>` : ''}<path transform="${variant.background ? 'translate(88 100) scale(0.6)' : 'translate(0 20)'}" d="${path}" fill="${variant.ink}"/></svg>\n`);
  await writeFile(publicFile(`${variant.prefix}.svg`), svg);
  const sizes = [16, 32, 48];
  const frames = [];
  for (const size of sizes) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(publicFile(`${variant.prefix}-${size}x${size}.png`), png);
    const rgba = await sharp(png).ensureAlpha().raw().toBuffer();
    frames.push(icoFrame(rgba, size));
  }

  const header = Buffer.alloc(6 + frames.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(frames.length, 4);
  let offset = header.length;
  frames.forEach((frame, index) => {
    const entry = 6 + index * 16;
    header[entry] = sizes[index];
    header[entry + 1] = sizes[index];
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(frame.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += frame.length;
  });
  await writeFile(publicFile(`${variant.prefix}.ico`), Buffer.concat([header, ...frames]));
}

// iOS supplies its own corner mask; use an opaque, full-square background for the touch icon.
await sharp(await readFile(publicFile('favicon.svg'))).resize(180, 180).flatten({ background }).png().toFile(publicFile('apple-touch-icon.png').pathname);
console.log('Generated solid and full-size transparent favicons: three SVGs, nine PNGs, three ICOs, and an Apple touch icon.');
