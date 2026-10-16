# AtomsAI logo assets

128 files: the full logotype and standalone symbol, in SVG, PNG, JPG and WEBP.

## Formats and colorways

- SVG, PNG and lossless WEBP: transparent backgrounds, in Deep green, Black, White and Cream.
- JPG: Deep green on Cream, Black on White, Cream on Deep green, White on Black. High-quality 4:4:4 encoding.
- Bitmap widths: 256, 512, 1024, 2048, 4096 pixels. Names ending in 1024w are 1024 pixels wide. Exact dimensions and checksums are in manifest.json; its path fields are relative to the package root (the same folder as the manifest).
- SVGs scale without resolution limits. Use them for large-format or vector work.

## Bounds and spacing

Transparent files retain the original master bounds and proportions. Add the required clear space in the layout: one lockup mark around the full logotype, half a symbol around the standalone symbol.

JPGs include that clear space inside the colored background. Their named pixel width includes the background canvas; the full logotype therefore occupies a smaller proportion than in a transparent export. No distortion or extra effects are applied.

All raster files use sRGB. PNG and JPG include 300 ppi metadata; pixel dimensions determine usable resolution. These are RGB assets, not press-specific CMYK separations. The largest transparent logotype is 4096 pixels wide (approximately 13.65 inches at 300 ppi).

## Organization

Each logo has its own folder, with svg, png, jpg and webp subfolders. Filenames identify the logo, ink/background and bitmap width. Keep the master proportions and minimum sizes in the brand guidelines.

Guidelines: https://petrknoll95.github.io/atoms-ai-brand/logo/
Generated from src/assets/brand/logo and src/data/colors.ts. Regenerate with npm run assets:logos; validate with npm run check:logos.
