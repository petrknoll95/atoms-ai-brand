import markSvg from '../assets/brand/logo/mark.svg?raw';
import logotypeSvg from '../assets/brand/logo/logotype.svg?raw';
import { colors } from './colors';

export { markSvg, logotypeSvg };

/** The master mark's single path (440 × 400). */
export const markPath = markSvg.match(/ d="([^"]+)"/)![1];

/** Mark and wordmark paths from the logotype master, in lockup space (see `lockup`). */
export const logotypeInner = logotypeSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/**
 * Lockup geometry of the master "Logo" component in Figma (1289:21547), in its own units.
 * The mark is 220 × 200 (X = 200); the wordmark starts after a 0.3X gap. Its x-height is
 * 56% of the mark (caps reach 155, lowercase 42 → 155).
 */
export const lockup = {
  width: 1077,
  height: 200,
  markWidth: 220,
  wordX: 280,
  capTop: 0,
  xTop: 42,
  baseline: 155,
  /** Custom kerning (thousandths of an em) between each letter pair, left to right. */
  kerning: [
    { pair: 'at', x: 395.4, value: -32 },
    { pair: 'to', x: 472.8, value: -18 },
    { pair: 'om', x: 596.3, value: -40 },
    { pair: 'ms', x: 781.9, value: -24 },
    { pair: 'sA', x: 890.4, value: -12 },
    { pair: 'AI', x: 1051.1, value: -36 },
  ],
};

/**
 * App icon (2.11): the mark in Cream on Deep green, spanning 60% of the container,
 * centered. Rounded square uses the Figma corner radius (40 on a 230 container).
 */
export function appIconSvg(shape: 'square' | 'circle') {
  const size = 230;
  const markW = size * 0.6;
  const scale = markW / 440;
  const markH = 400 * scale;
  const x = (size - markW) / 2;
  const y = (size - markH) / 2;
  const container =
    shape === 'square'
      ? `<rect width="${size}" height="${size}" rx="40" fill="${colors.deepGreen.hex}"/>`
      : `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${colors.deepGreen.hex}"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">` +
    container +
    `<path transform="translate(${x.toFixed(3)} ${y.toFixed(3)}) scale(${scale.toFixed(5)})" d="${markPath}" fill="${colors.cream.hex}"/>` +
    `</svg>`
  );
}
