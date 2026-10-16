import markSvg from '../assets/brand/logo/mark.svg?raw';
import logotypeSvg from '../assets/brand/logo/logotype.svg?raw';
import { colors } from './colors';

export { markSvg, logotypeSvg };

/** The master mark's single path (440 × 400). */
export const markPath = markSvg.match(/ d="([^"]+)"/)![1];

/** Mark and wordmark paths from the logotype master, in lockup space (see `lockup`). */
export const logotypeInner = logotypeSvg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/**
 * Lockup geometry of the master "Logotype" component in Figma (1330:27629), in its own units.
 * The mark is 220 × 200 (X = 200); the wordmark starts after a 0.3X gap and is centered on the
 * mark: capitals run from 20 to the baseline at 180, so the cap height is 80% of the mark.
 */
export const lockup = {
  width: 1132,
  height: 200,
  markWidth: 220,
  wordX: 280,
  capTop: 20,
  xTop: 67.3,
  baseline: 180,
  /**
   * Custom kerning (thousandths of an em) per letter pair, from the lockup slide. `bars` are the
   * left edges of the markers that bound each kerned span, `bar` their width.
   */
  kerning: [
    { pair: 'At', value: -36, bars: [436, 470.7], bar: 8 },
    { pair: 'to', value: -24, bars: [518.7, 552], bar: 5.3 },
    { pair: 'om', value: -32, bars: [648, 677.3], bar: 8 },
    { pair: 'ms', value: -18, bars: [840, 864], bar: 5.3 },
    { pair: 'sA', value: -32, bars: [942.7, 965.3], bar: 8 },
    { pair: 'AI', value: -30, bars: [1109.3], bar: 8 },
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
