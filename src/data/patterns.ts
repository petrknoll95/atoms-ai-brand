// Pattern spec, extracted from the "Patterns / Template / *" components in Figma
// (AtomsAI-Brand → WIP → "Pattern A" (Drift), "Pattern B" (Offset), "Frame 187" (Single band),
// "Pattern D – Concentric").
//
// Every template is an 840 × 840 field (the visible frame is the inner 800 × 800).
// A pattern is a base fill plus a tree of layers. Each layer is a solid color shown through a
// mask built from radial gradients repeated in every slit; groups can be masked too, and layers
// use a blend mode (normal, hard light, overlay, linear dodge). Density only changes the slit
// count. Concentric is a stack of rings (annuli) whose gradients form soft bands at the ring
// boundaries.

export const FIELD = 840;
export const VISIBLE = 800;

export type Role = string;
export type Blend = 'source-over' | 'hard-light' | 'lighter' | 'overlay';

/**
 * Gradient falloff curves, as used by the Figma stops: named shapes, or 33 alpha values
 * at evenly spaced stops (0, 1/32 … 1).
 */
export type Curve = 'fade86' | 'fade72' | 'cosine' | number[];

/** Figma gradientTransform: maps node-normalized space to gradient space. */
export type Transform = [[number, number, number], [number, number, number]];

/** A mask made of the same radial gradients in every slit. */
export interface SlitMask {
  paints: Transform[];
  curve: Curve;
  /** Opacity of each slit inside the mask. */
  slitOpacity?: number;
  /** Layer blur on the mask, in field units. */
  blur?: number;
  /** Opacity of the mask layer itself. */
  opacity?: number;
}

export type PatternNode =
  | { kind: 'fill'; role: Role; blend: Blend; mask?: SlitMask }
  | { kind: 'group'; blend: Blend; mask?: SlitMask; children: PatternNode[] };

export interface RingLayer {
  role: Role;
  blend: Blend;
  /** Constant mask value. Concentric's reflection is a stack of rings at 20% that covers the whole frame. */
  uniform?: number;
}

export type ColorwayName = 'Forest' | 'Sage' | 'Graphite' | 'Iris';
/** Colors by layer role (`base` is the field behind every layer). */
export type Colors = Record<string, string>;

export interface Structure {
  id: StructureId;
  name: string;
  description: string;
  densities: number[];
  colorways: Record<ColorwayName, Colors>;
  master: Colors;
}

export type StructureId = 'drift' | 'offset' | 'single-band' | 'concentric';

export const SLITS = [5, 10, 20, 40];

const reflection: Transform = [[0, 1, -0.0002], [-1.8578, 0, 2.3561]];

// Explicit Figma stop curves (Single band).
const sigmoid = [1, 1, 0.999, 0.999, 0.998, 0.996, 0.994, 0.99, 0.985, 0.976, 0.963, 0.943, 0.912, 0.864, 0.79, 0.676, 0.5, 0.324, 0.21, 0.136, 0.088, 0.057, 0.037, 0.024, 0.015, 0.01, 0.006, 0.004, 0.002, 0.001, 0.001, 0, 0];
const rampUp = [0, 0, 0.001, 0.003, 0.008, 0.015, 0.026, 0.042, 0.063, 0.089, 0.122, 0.162, 0.211, 0.268, 0.335, 0.412, 0.5, 0.588, 0.665, 0.732, 0.789, 0.838, 0.878, 0.911, 0.938, 0.958, 0.974, 0.985, 0.992, 0.997, 0.999, 1, 1];
const shade = [1, 1, 1, 0.999, 0.998, 0.996, 0.993, 0.99, 0.984, 0.978, 0.969, 0.959, 0.947, 0.933, 0.916, 0.897, 0.875, 0.85, 0.822, 0.791, 0.756, 0.717, 0.675, 0.629, 0.578, 0.523, 0.464, 0.399, 0.33, 0.256, 0.176, 0.091, 0];

const fill = (role: Role, blend: Blend, mask: SlitMask): PatternNode => ({ kind: 'fill', role, blend, mask });
const reflectionLayer = (blend: Blend): PatternNode =>
  fill('reflection', blend, { paints: [reflection], curve: 'cosine', slitOpacity: 0.2 });

export const slitLayers: Record<Exclude<StructureId, 'concentric'>, PatternNode[]> = {
  // Beams from the top and bottom edges: every field carries a gradient and its mirror.
  drift: [
    fill('lower', 'source-over', {
      curve: 'fade86', blur: 1.89,
      paints: [[[0.5263, 0, 0.2368], [0, 0.2907, -0.1541]], [[0.5263, 0, 0.2368], [0, -0.2907, 0.1366]]],
    }),
    fill('upper', 'source-over', {
      curve: 'fade86', blur: 1.89,
      paints: [[[0.5, 0, 0.25], [0, 0.2083, 0.8917]], [[0.5, 0, 0.25], [0, -0.2083, 1.1]]],
    }),
    fill('highlight', 'source-over', {
      curve: 'fade86', blur: 1.89,
      paints: [[[0.4348, 0, 0.2826], [0, -0.25, 1.2]], [[0.4348, 0, 0.2826], [0, 0.25, 0.95]]],
    }),
    reflectionLayer('lighter'),
  ],
  offset: [
    fill('upper', 'source-over', { curve: 'fade72', paints: [[[0.5, 0, 0.25], [0, 0.2128, 0.9043]]] }),
    fill('lower', 'source-over', {
      curve: 'fade72',
      paints: [[[0.5, 0, 0.5], [0, 0.2128, -0.0723]], [[0.5, 0, 0], [0, 0.2128, -0.0723]]],
    }),
    fill('highlight', 'source-over', {
      curve: 'fade72',
      paints: [[[0.5, 0, 0.5], [0, 0.303, -0.2485]], [[0.5, 0, 0], [0, 0.303, -0.2485]]],
    }),
    reflectionLayer('lighter'),
  ],
  // Three fields inside one slit-masked group, then a reflection, an overlay tint and a shade.
  'single-band': [
    {
      kind: 'group',
      blend: 'source-over',
      mask: { curve: sigmoid, blur: 1.89, paints: [[[0.3944, 0, 0.3028], [0, -0.3564, 0.6782]]] },
      children: [
        fill('field1', 'source-over', { curve: sigmoid, blur: 1.89, paints: [[[0.6109, 0, 0.1945], [0, -0.5454, 0.7727]]] }),
        fill('field2', 'source-over', { curve: sigmoid, blur: 1.89, paints: [[[0.6109, 0, 0.1945], [0, -0.714, 0.857]]] }),
        fill('field3', 'source-over', { curve: sigmoid, blur: 1.89, paints: [[[0.4275, 0, 0.2863], [0, -0.9485, 0.9743]]] }),
      ],
    },
    reflectionLayer('source-over'),
    fill('overlay', 'overlay', { curve: rampUp, opacity: 0.15, paints: [[[0, 1.2174, -0.1087], [-0.4898, 0, 0.7449]]] }),
    fill('shade', 'source-over', { curve: shade, paints: [[[0, 1.7178, -0.3589], [-1, 0, 1]]] }),
  ],
};

// Concentric is a stack of ring masks whose gradients Figma renders with padded stops.
// The masks are Figma's own SVG output (minified into public/pattern-masks), tinted at render time.
export const ringLayers: RingLayer[] = [
  { role: 'upper', blend: 'source-over' },
  { role: 'lower', blend: 'source-over' },
  { role: 'highlight', blend: 'source-over' },
  { role: 'reflection', blend: 'lighter', uniform: 0.2 },
];

export const ringMaskUrl = (density: number, role: Role) => `/pattern-masks/concentric-${density}-${role}.svg`;

const c = (base: string, upper: string, lower: string, highlight: string, reflection: string): Colors => ({
  base, upper, lower, highlight, reflection,
});

// Single band: three fields, a white reflection, an overlay tint and a shade.
const band = (base: string, field1: string, field2: string, field3: string, overlay: string, shade: string): Colors => ({
  base, field1, field2, field3, reflection: '#FFFFFF', overlay, shade,
});

export const structures: Structure[] = [
  {
    id: 'drift',
    name: 'Drift',
    description: 'Light enters from the top and bottom edges and meets in interleaved beams. Calm and balanced — a good default for large backgrounds.',
    densities: [0, 1, 2, 3],
    master: c('#000000', '#3E3E3E', '#313131', '#000000', '#FFFFFF'),
    colorways: {
      Forest: c('#27433B', '#42665A', '#42665A', '#10231E', '#F6F1E8'),
      Sage: c('#27433B', '#668978', '#668978', '#10231E', '#F6F1E8'),
      Graphite: c('#10231E', '#58625F', '#58625F', '#10231E', '#668978'),
      Iris: c('#8C78B0', '#D8CDE5', '#493F58', '#8C78B0', '#FFFFFF'),
    },
  },
  {
    id: 'offset',
    name: 'Offset',
    description: 'Light rises from the base in tapered, offset spikes. Directional and energetic — keep the quiet top of the field for type.',
    densities: [0, 1, 2, 3],
    master: c('#000000', '#919191', '#7F7F7F', '#585858', '#FFFFFF'),
    colorways: {
      Forest: c('#27433B', '#42665A', '#F6F1E8', '#585858', '#FFFFFF'),
      Sage: c('#27433B', '#668978', '#F6F1E8', '#585858', '#FFFFFF'),
      Graphite: c('#10231E', '#58625F', '#FAFAFA', '#585858', '#FFFFFF'),
      Iris: c('#8C78B0', '#8C78B0', '#D8CDE5', '#8C78B0', '#FFFFFF'),
    },
  },
  {
    id: 'single-band',
    name: 'Single band',
    description: 'One luminous band held across the middle of the frame. Strong and symmetrical — crop to frame a headline above or below it.',
    densities: [0, 1, 2, 3],
    master: band('#000000', '#FFFFFF', '#585858', '#000000', '#D8CDE5', '#000000'),
    colorways: {
      Forest: band('#27433B', '#A7AAA9', '#42665A', '#42665A', '#D8CDE5', '#27433B'),
      Sage: band('#27433B', '#A7AAA9', '#668978', '#668978', '#D8CDE5', '#27433B'),
      Graphite: band('#10231E', '#A7AAA9', '#58625F', '#58625F', '#FAFAFA', '#10231E'),
      Iris: band('#493F58', '#D8CDE5', '#8C78B0', '#8C78B0', '#D8CDE5', '#493F58'),
    },
  },
  {
    id: 'concentric',
    name: 'Concentric',
    description: 'Rings radiate evenly from the center, like a ripple. Use it to pull focus toward a single point or moment.',
    densities: [1, 2],
    master: c('#000000', '#4D4D4D', '#5A5A5A', '#2E2E2E', '#646464'),
    colorways: {
      Forest: c('#10231E', '#42665A', '#42665A', '#2E2E2E', '#646464'),
      Sage: c('#10231E', '#668978', '#668978', '#2E2E2E', '#646464'),
      Graphite: c('#10231E', '#58625F', '#58625F', '#2E2E2E', '#646464'),
      Iris: c('#493F58', '#8C78B0', '#8C78B0', '#D8CDE5', '#8C78B0'),
    },
  },
];

export const colorwayNames: ColorwayName[] = ['Forest', 'Sage', 'Graphite', 'Iris'];

export const structure = (id: StructureId) => structures.find((s) => s.id === id)!;
