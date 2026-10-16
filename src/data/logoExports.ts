import { colors } from './colors.ts';

export const logoSizes = [256, 512, 1024, 2048, 4096] as const;
export const logoFormats = ['svg', 'png', 'jpg', 'webp'] as const;
export type LogoFormat = (typeof logoFormats)[number];

// JPG margins follow the clear-space diagrams: one lockup mark around the logotype,
// half a standalone mark around the symbol. Both resolve to 220 × 200 master units.
export const logoVariants = [
  { id: 'logotype', name: 'Logotype', source: 'logotype.svg', padding: { x: 220, y: 200 } },
  { id: 'symbol', name: 'Symbol', source: 'mark.svg', padding: { x: 220, y: 200 } },
] as const;
export type LogoVariant = (typeof logoVariants)[number];

export const logoColorways = [
  { ink: colors.deepGreen, background: colors.cream },
  { ink: colors.black, background: colors.white },
  { ink: colors.cream, background: colors.deepGreen },
  { ink: colors.white, background: colors.black },
] as const;

export const logoFiles = logoVariants.flatMap((variant) => logoFormats.flatMap((format) =>
  logoColorways.flatMap(({ ink, background }) => (format === 'svg' ? [null] : logoSizes).map((width) => {
    const colorway = format === 'jpg' ? `${ink.token}-on-${background.token}` : ink.token;
    const filename = `atomsai-${variant.id}-${colorway}${width ? `-${width}w` : ''}.${format}`;
    return {
      variant: variant.id, name: variant.name, format, width,
      ink: ink.hex, inkToken: ink.token, inkName: ink.name,
      background: format === 'jpg' ? background.hex : null,
      colorway, filename,
      file: `/logos/${variant.id}/${format}/${filename}`,
    };
  })),
));
