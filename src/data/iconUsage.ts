import { colors } from './colors';
import { icon, icons, iconWeights } from './icons';
import { colorize, withStrokeWidth } from '../scripts/svg';

// Shared by the guideline specimens and downloadable reference pack.
export const iconSizes = [
  { size: 16, label: 'Minimum', use: 'Simple, familiar symbols beside a label.' },
  { size: 20, label: 'Compact', use: 'Dense lists and compact interface controls.' },
  { size: 24, label: 'Default', use: 'Buttons, navigation and detailed symbols.' },
  { size: 32, label: 'Feature', use: 'One supporting symbol in a feature card.' },
] as const;

export const iconUsage = {
  minimum: 16,
  detailedMinimum: 24,
  control: 44,
  labelGap: 8,
  controlGap: 8,
  groupGap: 16,
  featureLimit: 3,
  toolbarLimit: 5,
} as const;

export const quantityRules = [
  { title: 'One per action', text: 'Use one icon per button or link. Keep the label when the meaning is unfamiliar.' },
  { title: 'One per list item', text: 'Use one leading icon per navigation or list item. Add a trailing chevron only to indicate navigation or expansion.' },
  { title: `Up to ${iconUsage.featureLimit} per feature group`, text: 'Use one icon per feature card, with up to three cards in a group. On long pages, apply the limit per section.' },
  { title: `Up to ${iconUsage.toolbarLimit} icon actions`, text: 'Keep a toolbar to five visible icon actions. Move additional actions into a labelled More menu.' },
];

const ink = colors.deepGreen.hex;
const paper = colors.cream.hex;
const label = (x: number, y: number, text: string, size = 16, anchor = 'start') =>
  `<text x="${x}" y="${y}" fill="${ink}" font-family="PP Neue Montreal, Arial, sans-serif" font-size="${size}" text-anchor="${anchor}">${text}</text>`;

const placedIcon = (name: string, x: number, y: number, size: number, weight = '1.5', color = ink) =>
  `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="${weight}" stroke-linejoin="miter" stroke-linecap="butt">${icon(name).replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;

const drawing = (title: string, body: string, height = 240) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="${height}" viewBox="0 0 480 ${height}" role="img" aria-label="${title}"><title>${title}</title><rect width="480" height="${height}" fill="${paper}"/>${body}</svg>`;

const button = (x: number, width: number, contents: string) =>
  `<rect x="${x}" y="80" width="${width}" height="80" rx="40" fill="none" stroke="${ink}"/>${contents}`;

export const iconUsageExamples = [
  {
    id: 'size', title: 'Keep small icons readable',
    do: {
      caption: 'Do — use 24 px by default; preserve the open gaps.',
      svg: drawing('Do: an enlarged 24 px Regular search icon',
        placedIcon('search', 216, 72, 48) + label(240, 166, '24 px · Regular 1.5 px', 18, 'middle') + label(240, 195, 'Enlarged comparison', 14, 'middle')),
    },
    dont: {
      caption: 'Don’t — shrink icons below the 16 px minimum.',
      svg: drawing('Do not: an enlarged 12 px search icon, below the minimum',
        placedIcon('search', 228, 84, 24) + label(240, 166, '12 px · Below minimum', 18, 'middle') + label(240, 195, 'Enlarged comparison', 14, 'middle')),
    },
  },
  {
    id: 'action', title: 'Give each action one symbol',
    do: {
      caption: 'Do — one relevant icon and a clear label.',
      svg: drawing('Do: a Search button with one search icon',
        button(132, 216, placedIcon('search', 160, 100, 40) + label(218, 129, 'Search', 28))),
    },
    dont: {
      caption: 'Don’t — surround one action with several symbols.',
      svg: drawing('Do not: a Search button crowded with search, filter and arrow icons',
        button(70, 340, placedIcon('search', 94, 100, 40) + placedIcon('filter', 142, 100, 40)
          + label(200, 129, 'Search', 28) + placedIcon('arrow-right', 340, 100, 40))),
    },
  },
  {
    id: 'density', title: 'Leave room between actions',
    do: {
      caption: 'Do — show five actions; put the rest in More.',
      svg: drawing('Do: five well-spaced icon actions and a labelled More menu',
        ['search', 'filter', 'plus', 'arrow-up', 'info'].map((name, i) =>
          `<rect x="${64 + i * 52}" y="88" width="44" height="44" rx="22" fill="none" stroke="${ink}"/>`
          + placedIcon(name, 74 + i * 52, 98, 24)).join('')
        + `<rect x="332" y="88" width="84" height="44" rx="22" fill="none" stroke="${ink}"/>`
        + label(374, 116, 'More', 16, 'middle')
        + label(240, 184, '44 px controls · 8 px gaps', 18, 'middle')),
    },
    dont: {
      caption: 'Don’t — squeeze every action into one crowded row.',
      svg: drawing('Do not: eight tightly packed 24 px controls',
        ['search', 'filter', 'plus', 'minus', 'arrow-up', 'arrow-down', 'info', 'close'].map((name, i) =>
          `<rect x="${136 + i * 26}" y="98" width="24" height="24" rx="12" fill="none" stroke="${ink}"/>`
          + placedIcon(name, 136 + i * 26, 98, 24)).join('')
        + label(240, 184, 'Too many actions · Too little space', 18, 'middle')),
    },
  },
];

const sizeReference = drawing('AtomsAI icon sizes — view at 100% for actual size',
  `<rect x="0" y="236" width="480" height="124" fill="${ink}"/>`
  + label(28, 42, 'Icon size reference', 24)
  + label(28, 70, 'View at 100%. Measure the complete SVG frame.', 16)
  + iconSizes.map(({ size, label: name }, i) => {
    const x = 72 + i * 112;
    return placedIcon('search', x - size / 2, 126 - size / 2, size)
      + label(x, 174, `${size} px`, 18, 'middle') + label(x, 204, name, 14, 'middle')
      + placedIcon('search', x - size / 2, 282 - size / 2, size, '1.5', paper);
  }).join(''), 360);

export const iconUsageAssets = [
  { filename: 'size-reference.svg', title: 'Size reference', svg: sizeReference },
  ...iconUsageExamples.flatMap((example) => (['do', 'dont'] as const).map((kind) => ({
    filename: `${example.id}-${kind}.svg`, title: example[kind].caption, svg: example[kind].svg,
  }))),
];

export const iconUsageReadme = `# AtomsAI icon usage

Measure the entire SVG frame, including its built-in space. Inspect at 100%.

## Minimum sizes

${iconSizes.map(({ size, label, use }) => `- ${size} px — ${label}: ${use}`).join('\n')}
- Detailed symbols start at ${iconUsage.detailedMinimum} px. Enlarge or simplify if gaps close.
- Scale the master and stroke together. Regular = size × 1.5 / 24; Medium = size × 2 / 24.
- In print, start at 4.5 mm for simple icons and 6.5 mm for detailed icons; proof at final size.

## Quantity and spacing

${quantityRules.map(({ title, text }) => `- ${title}: ${text}`).join('\n')}
- Feature limits apply to promotional groups, not functional navigation lists.
- Leave at least ${iconUsage.labelGap} px between an icon frame and its label.
- Icon-only controls use a ${iconUsage.control} × ${iconUsage.control} px target, with at least ${iconUsage.controlGap} px between controls and ${iconUsage.groupGap} px between groups. The target can be invisible.
- Keep control size independent of icon size. Give icon-only controls an accessible name.
- Use an icon for an action, status or category. Use an illustration for a process or abstract idea when there is room for its 200 px simple / 280 px detailed minimum.

## Files

- size-reference.svg: actual 16, 20, 24 and 32 px specimens at 100%, on light and dark backgrounds.
- examples/: paired Do and Don't teaching diagrams. Don't files are intentional counterexamples, not production templates.
- icons/regular/ and icons/medium/: ${icons.length} original masters in each weight. 24-unit viewBox, concrete Deep green ink; change the root stroke to a permitted brand ink when needed.
- Reference sheets use editable text in PP Neue Montreal, with Arial fallback. Install the brand font for matching typography; icon masters have no font dependency.

${iconUsageExamples.map((example) => `### ${example.title}\n${example.do.caption}\n${example.dont.caption}`).join('\n\n')}
`;

export const iconUsageFiles = () => ({
  'README.md': iconUsageReadme,
  ...Object.fromEntries(iconUsageAssets.map((asset) => [
    asset.filename === 'size-reference.svg' ? asset.filename : `examples/${asset.filename}`, asset.svg,
  ])),
  ...Object.fromEntries(iconWeights.flatMap((weight) => icons.map((item) => [
    `icons/${weight.key}/${item.name}.svg`, colorize(withStrokeWidth(item.svg, weight.value), ink),
  ]))),
});
