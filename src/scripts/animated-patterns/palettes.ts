import { structures } from '../../data/patterns';
import { colors, rgb } from '../../data/colors';
import { patternThemes as sourceThemes } from './source-data';
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

// Preserve source geometry and effects while resolving the brand inks from current tokens.
export const patternThemes = Object.fromEntries(Object.entries(sourceThemes).map(([mode, theme]) => [mode,
  Object.fromEntries(Object.entries(theme).map(([role, value]) => {
    let ink: string | undefined;
    if (mode === 'light' && (role.endsWith('/base') || role === 'pattern/single-band/reflection-3') && !role.includes('/concentric/')) ink = colors.deepGreen.hex;
    if (role.endsWith('/upper-field') || (role.endsWith('/lower-field') && (role.includes('/drift/') || role.includes('/concentric/')))) ink = mode === 'light' ? colors.sage.hex : colors.forestGreen.hex;
    if (mode === 'dark' && role === 'pattern/drift/reflection') ink = colors.sage.hex;
    return [role, ink ? [...toP3(ink), value[3]] : value];
  })),
])) as typeof sourceThemes;
