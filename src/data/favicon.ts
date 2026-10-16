export const faviconVariants = [
  { prefix: 'favicon', label: 'Deep green background' },
  { prefix: 'favicon-transparent-deep-green', label: 'Transparent · Deep green' },
  { prefix: 'favicon-transparent-cream', label: 'Transparent · Cream' },
];

export const faviconFiles = [
  ...faviconVariants.flatMap(({ prefix, label }) => [
    { file: `/${prefix}.svg`, label, detail: 'SVG · scalable' },
    { file: `/${prefix}.ico`, label, detail: 'ICO · 16, 32, 48 px' },
    ...[16, 32, 48].map((size) => ({ file: `/${prefix}-${size}x${size}.png`, label, detail: `PNG · ${size} × ${size} px` })),
  ]),
  { file: '/apple-touch-icon.png', label: 'Apple touch icon', detail: '180 × 180 px' },
];

export const faviconLinks = [
  { rel: 'icon', file: '/favicon.ico', type: 'image/x-icon', sizes: '16x16 32x32 48x48' },
  { rel: 'icon', file: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' },
  { rel: 'apple-touch-icon', file: '/apple-touch-icon.png', type: 'image/png', sizes: '180x180' },
];

export const faviconMarkup = faviconLinks.map(({ file, rel, type, sizes }) =>
  `<link rel="${rel}" href="${file}" type="${type}" sizes="${sizes}">`,
).join('\n');

export const faviconReadme = `# AtomsAI favicon kit

Choose either a transparent, full-size mark or a Cream mark on a solid Deep green background. Preserve the original artwork and its proportions; never substitute the full logotype at favicon sizes.

The transparent mark fills the entire canvas width, centered vertically in a square. Deep green is for light surfaces; Cream is for dark surfaces. The solid background version keeps the app-icon proportions (60% mark width) and is the site's default.

## Files

${faviconFiles.map(({ file, label, detail }) => `- ${file.slice(1)} — ${label}, ${detail}`).join('\n')}

Each ICO holds matching 16, 32 and 48 px frames. The default SVG/PNGs and Apple touch icon have an opaque Deep green background. The transparent variants contain only the mark, with no container or baked-in background.

## Installation

Place the files in your site's public root and add these lines inside the HTML head. If the site is hosted under a subdirectory, prefix each href with that base path.

\`\`\`html
${faviconMarkup}
\`\`\`

To use a transparent variant, replace favicon.svg and favicon.ico with the matching transparent filenames. Choose the ink for the surrounding browser surface and check contrast in the target browser. The Apple touch icon stays on its solid background.

Browser caches can retain an old icon after deployment. Reload or reopen the tab to check an update.

Guidelines: https://petrknoll95.github.io/atoms-ai-brand/logo/#favicon
`;
