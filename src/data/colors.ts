// Single source of truth for the AtomsAI palette.
// Mirrors the "Brand colors" variable collection in Figma (AtomsAI-Brand, Brand Guidelines).
// /tokens.css is generated from this file — never hard-code hex values elsewhere.

export type ColorGroup = 'forest' | 'neutral' | 'iris' | 'mono';

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
  irisShade: { token: 'iris-shade', name: 'Iris shade', hex: '#493F58', group: 'iris', cmyk: [17, 28, 0, 65] },
  iris: { token: 'iris', name: 'Iris', hex: '#8C78B0', group: 'iris', cmyk: [20, 32, 0, 31] },
  irisTint: { token: 'iris-tint', name: 'Iris tint', hex: '#D8CDE5', group: 'iris', cmyk: [6, 10, 0, 10] },
  black: { token: 'black', name: 'Black', hex: '#000000', group: 'mono' },
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
    { key: 'iris', weight: 4.6 },
    { key: 'irisTint', weight: 4 },
    { key: 'irisShade', weight: 1 },
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
    intro: 'Iris is our single accent. Use it sparingly — for emphasis, highlights and moments that need lift — never as a dominant field.',
    keys: ['iris', 'irisTint', 'irisShade'] as ColorKey[],
  },
};

export const ramps = {
  shades: ['forestShade', 'deepGreen', 'forestGreen', 'sage', 'sageTint', 'stone', 'cream'] as ColorKey[],
  neutrals: ['forestShade', 'charcoal', 'graphite', 'slate', 'ash', 'mist', 'paper'] as ColorKey[],
};

// 3.7 Combinations — lead / support / accent at roughly 60/30/10.
export const combinations: [ColorKey, ColorKey, ColorKey][] = [
  ['deepGreen', 'forestGreen', 'cream'],
  ['forestGreen', 'paper', 'graphite'],
  ['stone', 'forestShade', 'sage'],
  ['cream', 'sageTint', 'forestGreen'],
  ['irisShade', 'iris', 'irisTint'],
  ['deepGreen', 'cream', 'iris'],
];

// 3.8 Gradients — soft vertical blends. Stops are sampled from the eased Figma ramps (top → bottom).
export const gradients: { from: ColorKey; to: ColorKey; stops: string[] }[] = [
  { from: 'forestShade', to: 'forestGreen', stops: ['#10231E 0%', '#11251F 13%', '#142923 25%', '#1B322B 41%', '#1F3831 50%', '#264038 63%', '#2B473F 75%', '#2F4C43 88%', '#304E44 100%'] },
  { from: 'cream', to: 'stone', stops: ['#F6F1E8 0%', '#F4F0E6 13%', '#EFECE1 25%', '#E5E4D7 41%', '#DEDFD1 50%', '#D5D8C8 63%', '#CED2C1 75%', '#C9CEBC 88%', '#C7CDBA 100%'] },
  { from: 'forestShade', to: 'iris', stops: ['#10231E 0%', '#122420 13%', '#1D2C2D 25%', '#393F4E 41%', '#4E4E67 50%', '#6A6188 63%', '#7F6FA1 75%', '#8A77AE 88%', '#8C78B0 100%'] },
  { from: 'irisTint', to: 'irisShade', stops: ['#D8CDE5 0%', '#D8CDE5 22%', '#D6CBE3 34%', '#D1C6DE 47%', '#C6BBD3 59%', '#B8ADC6 69%', '#A398B0 78%', '#847A92 88%', '#5A5069 97%', '#493F58 100%'] },
  { from: 'forestShade', to: 'cream', stops: ['#10231E 0%', '#1A2C27 13%', '#34433E 25%', '#636D67 41%', '#838A83 50%', '#ADB0A8 63%', '#D2D1C8 75%', '#ECE8DF 88%', '#F6F1E8 100%'] },
  { from: 'forestGreen', to: 'stone', stops: ['#42665A 0%', '#486A5E 13%', '#577669 25%', '#728B7D 41%', '#84998A 50%', '#9DAC9C 63%', '#B2BDAB 75%', '#C1C9B6 88%', '#C7CDBA 100%'] },
  { from: 'iris', to: 'irisTint', stops: ['#8C78B0 0%', '#8F7CB2 13%', '#9885B8 25%', '#A797C3 41%', '#B2A2CB 50%', '#C0B2D4 63%', '#CCC0DD 75%', '#D5C9E3 88%', '#D8CDE5 100%'] },
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
    intro: 'Accent themes for moments that need lift. Use sparingly, alongside a Forest theme.',
    steps: [
      { label: 'Light', bg: 'irisTint', fg: 'irisShade' },
      { label: 'Mid', bg: 'iris', fg: 'forestShade' },
      { label: 'Dark', bg: 'irisShade', fg: 'irisTint' },
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
