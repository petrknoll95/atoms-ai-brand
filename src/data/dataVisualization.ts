import type { ColorKey } from './colors';

export interface OverlappingBarExample {
  id: string;
  variant: string;
  title: string;
  unit: string;
  suffix?: string;
  maximum: number;
  orientation: 'vertical' | 'horizontal';
  background: ColorKey;
  foreground: ColorKey;
  series: { name: string; value: number; color: ColorKey }[];
}

// Illustrative data. The numeric axis always starts at zero; thickness only reveals layers.
export const overlappingBarExamples: OverlappingBarExample[] = [
  {
    id: 'iris-comparison',
    variant: 'Two series · Iris',
    title: 'Requests handled\nper week',
    unit: 'Requests',
    maximum: 200,
    orientation: 'vertical',
    background: 'paper',
    foreground: 'deepGreen',
    series: [
      { name: 'Team A', value: 189, color: 'irisLight' },
      { name: 'Team B', value: 100, color: 'iris' },
    ],
  },
  {
    id: 'forest-comparison',
    variant: 'Three series · Forest',
    title: 'Workflows completed\nby region',
    unit: 'Workflows',
    maximum: 300,
    orientation: 'vertical',
    background: 'cream',
    foreground: 'deepGreen',
    series: [
      { name: 'Europe', value: 280, color: 'stone' },
      { name: 'Americas', value: 190, color: 'sage' },
      { name: 'Asia Pacific', value: 100, color: 'deepGreen' },
    ],
  },
  {
    id: 'iris-horizontal-comparison',
    variant: 'Horizontal · Iris',
    title: 'Average time\nto resolution',
    unit: 'Hours',
    suffix: 'h',
    maximum: 60,
    orientation: 'horizontal',
    background: 'paper',
    foreground: 'deepGreen',
    series: [
      { name: 'Before', value: 48, color: 'irisLight' },
      { name: 'After', value: 30, color: 'irisDark' },
    ],
  },
  {
    id: 'grey-comparison',
    variant: 'Dark surface · True greys',
    title: 'Tasks completed\non time',
    unit: 'Completion rate',
    suffix: '%',
    maximum: 100,
    orientation: 'vertical',
    background: 'forestShade',
    foreground: 'paper',
    series: [
      { name: 'This quarter', value: 92, color: 'grey1' },
      { name: 'Last quarter', value: 58, color: 'grey3' },
    ],
  },
];

export interface LineGraphExample {
  id: string;
  variant: string;
  title: string;
  unit: string;
  suffix?: string;
  maximum: number;
  background: ColorKey;
  foreground: ColorKey;
  fill: ColorKey;
  points: { year: number; value: number }[];
}

const annualPoints = (values: number[]) => values.map((value, index) => ({ year: 2017 + index, value }));

export const lineGraphExamples: LineGraphExample[] = [
  {
    id: 'iris-line',
    variant: 'Iris',
    title: 'Less time spent\non each request',
    unit: 'Minutes per request',
    maximum: 40,
    background: 'irisLight',
    foreground: 'irisDark',
    fill: 'iris',
    points: annualPoints([34, 32, 26, 16, 11, 14, 10, 12, 8, 5]),
  },
  {
    id: 'forest-line',
    variant: 'Forest',
    title: 'More everyday tasks\nrunning automatically',
    unit: 'Share of tasks automated',
    suffix: '%',
    maximum: 100,
    background: 'cream',
    foreground: 'deepGreen',
    fill: 'stone',
    points: annualPoints([18, 24, 29, 44, 41, 57, 64, 69, 78, 86]),
  },
  {
    id: 'grey-line',
    variant: 'True greys',
    title: 'A shorter path\nfrom brief to launch',
    unit: 'Days to launch',
    maximum: 40,
    background: 'paper',
    foreground: 'charcoal',
    fill: 'grey2',
    points: annualPoints([28, 27, 24, 20, 22, 16, 14, 15, 10, 8]),
  },
];

export const circleExamples = {
  unitStacks: {
    unit: 500,
    categories: [
      { name: 'Support', value: 4000 },
      { name: 'Sales', value: 2000 },
      { name: 'Operations', value: 1500 },
      { name: 'Finance', value: 1000 },
    ],
  },
  dotGrid: { total: 100, highlighted: 72 },
  proportional: [
    { name: 'Team A', value: 900, color: 'irisDark' },
    { name: 'Team B', value: 400, color: 'iris' },
    { name: 'Team C', value: 100, color: 'irisLight' },
  ] satisfies { name: string; value: number; color: ColorKey }[],
  network: {
    nodes: [
      { name: 'Agent', x: 350, y: 200, primary: true },
      { name: 'CRM', x: 100, y: 85, primary: false },
      { name: 'Support', x: 100, y: 315, primary: false },
      { name: 'Documents', x: 350, y: 50, primary: false, labelAbove: true },
      { name: 'Data', x: 600, y: 85, primary: false },
      { name: 'Operations', x: 600, y: 315, primary: false },
    ],
    links: [[0, 1], [0, 2], [0, 3], [0, 4], [0, 5]],
  },
};
