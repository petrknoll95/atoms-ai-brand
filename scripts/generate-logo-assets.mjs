// Rebuild the client delivery from canonical SVGs and palette tokens. Never redraw artwork.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { logoFiles, logoSizes, logoVariants } from '../src/data/logoExports.ts';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/logos');
const masters = new Map(await Promise.all(logoVariants.map(async (variant) => {
  const svg = await readFile(join(root, 'src/assets/brand/logo', variant.source), 'utf8');
  const [, , width, height] = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number);
  return [variant.id, { ...variant, svg, width, height }];
})));
const manifest = { version: 1, sizes: logoSizes, sizeUnit: 'canvas width in pixels', files: [] };

for (const file of logoFiles) {
  const master = masters.get(file.variant);
  const colored = master.svg.replaceAll('currentColor', file.ink);
  let canvasWidth = master.width;
  let canvasHeight = master.height;
  let svg = colored;
  if (file.format === 'jpg') {
    canvasWidth += 2 * master.padding.x;
    canvasHeight += 2 * master.padding.y;
    const inner = colored.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" fill="${file.ink}"><rect width="100%" height="100%" fill="${file.background}"/><g transform="translate(${master.padding.x} ${master.padding.y})">${inner}</g></svg>`;
  }
  let data;
  let width = null;
  let height = null;
  if (file.format === 'svg') {
    data = Buffer.from(colored);
  } else {
    width = file.width;
    height = Math.round(width * canvasHeight / canvasWidth);
    // Rasterize the vector at final resolution, rather than enlarging a small bitmap.
    const pipeline = sharp(Buffer.from(svg), { density: 72 * width / canvasWidth })
      .resize(width, height, { fit: 'contain', background: file.background ?? '#00000000' })
      .withMetadata({ density: 300 });
    if (file.format === 'png') data = await pipeline.png({ compressionLevel: 9 }).toBuffer();
    else if (file.format === 'webp') data = await pipeline.webp({ lossless: true, effort: 6 }).toBuffer();
    else data = await pipeline.flatten({ background: file.background }).jpeg({ quality: 96, chromaSubsampling: '4:4:4' }).toBuffer();
  }
  const path = join(root, 'public', file.file);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, data);
  const { file: _publicFile, ...descriptor } = file;
  manifest.files.push({
    ...descriptor, path: file.file.replace('/logos/', ''), width, height, transparent: file.format !== 'jpg',
    bytes: data.length, sha256: createHash('sha256').update(data).digest('hex'),
  });
}

await writeFile(join(output, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
await writeFile(join(output, 'README.md'), `# AtomsAI logo assets

128 files: the full logotype and standalone symbol, in SVG, PNG, JPG and WEBP.

## Formats and colorways

- SVG, PNG and lossless WEBP: transparent backgrounds, in Deep green, Black, White and Cream.
- JPG: Deep green on Cream, Black on White, Cream on Deep green, White on Black. High-quality 4:4:4 encoding.
- Bitmap widths: ${logoSizes.join(', ')} pixels. Names ending in 1024w are 1024 pixels wide. Exact dimensions and checksums are in manifest.json; its path fields are relative to the package root (the same folder as the manifest).
- SVGs scale without resolution limits. Use them for large-format or vector work.

## Bounds and spacing

Transparent files retain the original master bounds and proportions. Add the required clear space in the layout: one lockup mark around the full logotype, half a symbol around the standalone symbol.

JPGs include that clear space inside the colored background. Their named pixel width includes the background canvas; the full logotype therefore occupies a smaller proportion than in a transparent export. No distortion or extra effects are applied.

All raster files use sRGB. PNG and JPG include 300 ppi metadata; pixel dimensions determine usable resolution. These are RGB assets, not press-specific CMYK separations. The largest transparent logotype is 4096 pixels wide (approximately 13.65 inches at 300 ppi).

## Organization

Each logo has its own folder, with svg, png, jpg and webp subfolders. Filenames identify the logo, ink/background and bitmap width. Keep the master proportions and minimum sizes in the brand guidelines.

Guidelines: https://petrknoll95.github.io/atoms-ai-brand/logo/
Generated from src/assets/brand/logo and src/data/colors.ts. Regenerate with npm run assets:logos; validate with npm run check:logos.
`);
console.log(`Generated ${manifest.files.length} logo files (${(manifest.files.reduce((sum, file) => sum + file.bytes, 0) / 1024 / 1024).toFixed(1)} MB).`);
