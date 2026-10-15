// Stroke icon library (Iconography 6.3): 24 px grid, 1.5 px Regular stroke, miter joins, butt caps.
const files = import.meta.glob<string>('../assets/brand/icons/*.svg', { query: '?raw', import: 'default', eager: true });

const order = [
  'arrow-northeast',
  'arrow-up',
  'arrow-right',
  'arrow-down',
  'arrow-left',
  'chevron-up',
  'chevron-right',
  'chevron-down',
  'chevron-left',
  'filter',
  'plus',
  'minus',
  'search',
  'close',
  'info',
];

export const icons = order.map((name) => {
  const svg = files[`../assets/brand/icons/${name}.svg`];
  if (!svg) throw new Error(`Missing icon ${name}`);
  return { name, svg: svg.trim() };
});

export const icon = (name: string) => icons.find((i) => i.name === name)!.svg;

/** Stroke weights at 24 px: Regular pairs with body copy, Medium with headlines. */
export const iconWeights = [
  { key: 'regular', label: 'Regular 1.5', value: '1.5' },
  { key: 'medium', label: 'Medium 2', value: '2' },
];
