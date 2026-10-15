import { assetColors, colors } from './colors';

export interface ColorOption {
  key: string;
  label: string;
  ink: string;
  surface?: string;
  /** `dark` previews on Deep green so light artwork stays visible. */
  tone: 'light' | 'dark';
}

export interface WeightOption {
  key: string;
  label: string;
  value: string;
}

const lightInks = new Set(['cream', 'white']);

/** Black, Deep green, Cream and White — every logo and icon ships in these. */
export const defaultColorOptions: ColorOption[] = assetColors.map((key) => ({
  key: colors[key].token,
  label: colors[key].name,
  ink: colors[key].hex,
  tone: lightInks.has(colors[key].token) ? 'dark' : 'light',
}));
