import { assetColors, colors } from './colors';

export interface ColorOption {
  key: string;
  label: string;
  ink: string;
  surface?: string;
  /** Preview background: `light` on White, `dark` on Deep green (Cream artwork), `black` on Black (White artwork). */
  tone: 'light' | 'dark' | 'black';
}

export interface WeightOption {
  key: string;
  label: string;
  value: string;
}

// White artwork always previews on Black; Cream on Deep green.
const toneOf = (token: string): ColorOption['tone'] => (token === 'white' ? 'black' : token === 'cream' ? 'dark' : 'light');

/** Black, Deep green, Cream and White — every logo and icon ships in these. */
export const defaultColorOptions: ColorOption[] = assetColors.map((key) => ({
  key: colors[key].token,
  label: colors[key].name,
  ink: colors[key].hex,
  tone: toneOf(colors[key].token),
}));
