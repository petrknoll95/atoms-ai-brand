// Single source of truth for the AtomsAI palette.
// Accent colors sampled from the approved reference image and converted to sRGB.
// /tokens.css is generated from this file — never hard-code hex values elsewhere.

export type ColorGroup = 'forest' | 'neutral' | 'mono' | 'accent';

export interface BrandColor {
  token: string; // CSS custom property name, without the leading --
  name: string;
  hex: string;
  group: ColorGroup;
  cmyk?: [number, number, number, number];
}

const palette = {
  forestShade: { token: 'forest-shade', name: 'Forest shade', hex: '#10231E', group: 'forest' },
  deepGreen: { token: 'deep-green', name: 'Deep green', hex: '#27433B', group: 'forest', cmyk: [42, 0, 12, 74] },
  forestGreen: { token: 'forest-green', name: 'Forest green', hex: '#42665A', group: 'forest', cmyk: [35, 0, 12, 60] },
  sage: { token: 'sage', name: 'Sage', hex: '#668978', group: 'forest' },
  sageTint: { token: 'sage-tint', name: 'Sage tint', hex: '#94AC96', group: 'forest', cmyk: [14, 0, 13, 33] },
  stone: { token: 'stone', name: 'Stone', hex: '#C7CDBA', group: 'forest', cmyk: [3, 0, 9, 20] },
  cream: { token: 'cream', name: 'Cream', hex: '#F6F1E8', group: 'forest', cmyk: [0, 2, 6, 4] },
  charcoal: { token: 'charcoal', name: 'Charcoal', hex: '#33413D', group: 'neutral' },
  graphite: { token: 'graphite', name: 'Graphite', hex: '#58625F', group: 'neutral' },
  slate: { token: 'slate', name: 'Slate', hex: '#7E8583', group: 'neutral' },
  ash: { token: 'ash', name: 'Ash', hex: '#A7AAA9', group: 'neutral' },
  mist: { token: 'mist', name: 'Mist', hex: '#D0D1D1', group: 'neutral' },
  paper: { token: 'paper', name: 'Paper', hex: '#FAFAFA', group: 'neutral' },
  irisDark: { token: 'iris-dark', name: 'Iris Dark', hex: '#514264', group: 'accent' },
  iris: { token: 'iris', name: 'Iris', hex: '#927BB8', group: 'accent' },
  irisLight: { token: 'iris-light', name: 'Iris Light', hex: '#D5C6EB', group: 'accent' },
  crimson: { token: 'crimson', name: 'Crimson', hex: '#A20000', group: 'accent' },
  orange: { token: 'orange', name: 'Orange', hex: '#FF5600', group: 'accent' },
  apricot: { token: 'apricot', name: 'Apricot', hex: '#F9C085', group: 'accent' },
  black: { token: 'black', name: 'Black', hex: '#000000', group: 'mono' },
  grey5: { token: 'grey-5', name: 'Grey 5', hex: '#292929', group: 'mono' },
  grey4: { token: 'grey-4', name: 'Grey 4', hex: '#4E4E4E', group: 'mono' },
  grey3: { token: 'grey-3', name: 'Grey 3', hex: '#777777', group: 'mono' },
  grey2: { token: 'grey-2', name: 'Grey 2', hex: '#A2A2A2', group: 'mono' },
  grey1: { token: 'grey-1', name: 'Grey 1', hex: '#D0D0D0', group: 'mono' },
  white: { token: 'white', name: 'White', hex: '#FFFFFF', group: 'mono' },
} satisfies Record<string, BrandColor>;

export type ColorKey = keyof typeof palette;
export const colors: Record<ColorKey, BrandColor> = palette;
export const allColors: BrandColor[] = Object.values(colors);

export const rgb = (hex: string): [number, number, number] => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

/** Bare hex without the leading # — the format the guidelines print. */
export const bare = (hex: string) => hex.slice(1).toUpperCase();

// 3.1 Overview — columns of the palette mosaic, top to bottom, with relative heights.
export const overview: { key: ColorKey; weight: number }[][] = [
  [{ key: 'deepGreen', weight: 1 }],
  [
    { key: 'sageTint', weight: 1 },
    { key: 'sage', weight: 1 },
    { key: 'forestGreen', weight: 6.5 },
    { key: 'forestShade', weight: 1 },
  ],
  [
    { key: 'cream', weight: 3.6 },
    { key: 'stone', weight: 1 },
    { key: 'paper', weight: 4 },
    { key: 'graphite', weight: 1 },
  ],
  [
    { key: 'irisDark', weight: 1 },
    { key: 'iris', weight: 1 },
    { key: 'irisLight', weight: 1 },
    { key: 'crimson', weight: 1 },
    { key: 'orange', weight: 1 },
    { key: 'apricot', weight: 1 },
  ],
];

export const roles = {
  primary: {
    intro: 'Deep green and cream are the foundation. Use them for most surfaces, type and layouts — together they carry the brand on their own.',
    keys: ['deepGreen', 'cream'] as ColorKey[],
  },
  secondary: {
    intro: 'Forest green, sage tint and stone add depth and rhythm. They support the primary pair in backgrounds, patterns and secondary surfaces.',
    keys: ['forestGreen', 'sageTint', 'stone'] as ColorKey[],
  },
  accent: {
    intro: 'Two accent families, each with dark, mid and light tones. Use Iris or Orange for focal elements and the dark and light tones for surfaces. Choose one family per layout and keep Forest as the default foundation.',
    keys: ['irisDark', 'iris', 'irisLight', 'crimson', 'orange', 'apricot'] as ColorKey[],
  },
};

export const ramps = {
  shades: ['forestShade', 'deepGreen', 'forestGreen', 'sage', 'sageTint', 'stone', 'cream'] as ColorKey[],
  trueGreys: ['black', 'grey5', 'grey4', 'grey3', 'grey2', 'grey1', 'white'] as ColorKey[],
  neutrals: ['forestShade', 'charcoal', 'graphite', 'slate', 'ash', 'mist', 'paper'] as ColorKey[],
};

// 3.7 Combinations — lead / support / accent at roughly 60/30/10.
export const combinations: [ColorKey, ColorKey, ColorKey][] = [
  ['deepGreen', 'forestGreen', 'cream'],
  ['forestGreen', 'paper', 'graphite'],
  ['stone', 'forestShade', 'sage'],
  ['cream', 'sageTint', 'forestGreen'],
  ['irisDark', 'irisLight', 'iris'],
  ['crimson', 'apricot', 'orange'],
  ['deepGreen', 'cream', 'iris'],
  ['deepGreen', 'cream', 'orange'],
];

// 3.8 Gradients — original Forest recipes plus current accent blends (top → bottom).
export const gradients: { from: ColorKey; to: ColorKey; stops: string[] }[] = [
  { from: 'forestShade', to: 'forestGreen', stops: ['#10231E 0%', '#11251F 13%', '#142923 25%', '#1B322B 41%', '#1F3831 50%', '#264038 63%', '#2B473F 75%', '#2F4C43 88%', '#304E44 100%'] },
  { from: 'cream', to: 'stone', stops: ['#F6F1E8 0%', '#F4F0E6 13%', '#EFECE1 25%', '#E5E4D7 41%', '#DEDFD1 50%', '#D5D8C8 63%', '#CED2C1 75%', '#C9CEBC 88%', '#C7CDBA 100%'] },
  { from: 'forestShade', to: 'iris', stops: [colors.forestShade.hex + ' 0%', colors.iris.hex + ' 100%'] },
  { from: 'irisLight', to: 'irisDark', stops: [colors.irisLight.hex + ' 0%', colors.irisDark.hex + ' 100%'] },
  { from: 'forestShade', to: 'cream', stops: ['#10231E 0%', '#1A2C27 13%', '#34433E 25%', '#636D67 41%', '#838A83 50%', '#ADB0A8 63%', '#D2D1C8 75%', '#ECE8DF 88%', '#F6F1E8 100%'] },
  { from: 'forestGreen', to: 'stone', stops: ['#42665A 0%', '#486A5E 13%', '#577669 25%', '#728B7D 41%', '#84998A 50%', '#9DAC9C 63%', '#B2BDAB 75%', '#C1C9B6 88%', '#C7CDBA 100%'] },
  { from: 'iris', to: 'irisLight', stops: [colors.iris.hex + ' 0%', colors.irisLight.hex + ' 100%'] },
  { from: 'sageTint', to: 'deepGreen', stops: ['#94AC96 0%', '#8FA792 13%', '#839C88 25%', '#6D8675 41%', '#5E7869 50%', '#496458 63%', '#385349 75%', '#2C483F 88%', '#27433B 100%'] },
];

export const gradientCss = (g: (typeof gradients)[number]) => `linear-gradient(180deg, ${g.stops.join(', ')})`;

// 3.9–3.11 Themes — each pairs one background with one foreground.
export const themes: { name: string; intro: string; steps: { label: string; bg: ColorKey; fg: ColorKey }[] }[] = [
  {
    name: 'Forest',
    intro: 'The default. Deep green and cream across three tonal steps — each theme pairs one background with one foreground.',
    steps: [
      { label: 'Light', bg: 'cream', fg: 'deepGreen' },
      { label: 'Mid', bg: 'forestGreen', fg: 'cream' },
      { label: 'Dark', bg: 'forestShade', fg: 'cream' },
    ],
  },
  {
    name: 'Neutral',
    intro: 'Quieter surfaces for documents, product and data-heavy layouts.',
    steps: [
      { label: 'Light', bg: 'paper', fg: 'forestShade' },
      { label: 'Mid', bg: 'slate', fg: 'forestShade' },
      { label: 'Dark', bg: 'charcoal', fg: 'paper' },
    ],
  },
  {
    name: 'Iris',
    intro: 'Supporting backgrounds and panels. Use occasionally alongside a Forest theme.',
    steps: [
      { label: 'Light', bg: 'irisLight', fg: 'irisDark' },
      { label: 'Mid', bg: 'iris', fg: 'black' },
      { label: 'Dark', bg: 'irisDark', fg: 'irisLight' },
    ],
  },
  {
    name: 'Orange',
    intro: 'Warm accent surfaces. Use occasionally alongside a Forest theme.',
    steps: [
      { label: 'Light', bg: 'apricot', fg: 'crimson' },
      { label: 'Mid', bg: 'orange', fg: 'black' },
      { label: 'Dark', bg: 'crimson', fg: 'apricot' },
    ],
  },

];

// WCAG 2.x relative luminance and contrast ratio.
const channel = (v: number) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r, g, b] = rgb(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
};
export const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
export const wcag = (ratio: number) =>
  ratio >= 7 ? 'AAA' : ratio >= 4.5 ? 'AA' : ratio >= 3 ? 'AA Large' : 'Fail';

/** The four colors every logo and icon can be downloaded in. */
export const assetColors: ColorKey[] = ['black', 'deepGreen', 'cream', 'white'];

/** The palette as CSS custom properties (served at /tokens.css). */
export const tokensCss = () =>
  `/* AtomsAI brand colors */\n:root {\n${allColors.map((c) => `  --${c.token}: ${c.hex};`).join('\n')}\n}\n`;
