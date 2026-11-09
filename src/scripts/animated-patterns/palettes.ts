import { structures } from '../../data/patterns';
import { rgb } from '../../data/colors';
import type { PatternColor, PatternColors, PatternKind } from './types';

// The renderer blends encoded Display P3. Convert the sRGB palette on input.
function toP3(hex: string): PatternColor {
  const [r, g, b] = rgb(hex).map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  const linear = [0.82259287 * r + 0.17753395 * g, 0.03319951 * r + 0.9667835 * g, 0.01708535 * r + 0.07239572 * g + 0.91030148 * b];
  return linear.map(v => v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055) as unknown as PatternColor;
}

export const irisColors = Object.fromEntries(structures.map(s => {
  const colors = Object.fromEntries(Object.entries(s.colorways.Iris).map(([role, hex]) => [role, toP3(hex)])) as PatternColors;
  if (s.id === 'concentric') colors.reflectionBase = colors.base;
  return [s.id, colors];
})) as Record<PatternKind, PatternColors>;
