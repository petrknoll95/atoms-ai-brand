import { withBase } from './base';

// Self-hosted brand fonts from public/fonts. Layouts inline these declarations rather than putting
// them in global.css so the URLs carry the base path: Vite only rewrites root-absolute CSS URLs in
// the build, not in dev.
const faces = [
  ['Founders Grotesk', 'FoundersGrotesk-Regular', 400],
  ['Founders Grotesk', 'FoundersGrotesk-Medium', 500],
  ['PP Neue Montreal', 'PPNeueMontreal-Regular', 400],
  ['PP Neue Montreal', 'PPNeueMontreal-Medium', 500],
] as const;

export const fontFaceCss = () =>
  faces
    .map(
      ([family, file, weight]) =>
        `@font-face { font-family: '${family}'; src: url('${withBase(`/fonts/${file}.woff2`)}') format('woff2'); font-weight: ${weight}; font-style: normal; font-display: swap; }`,
    )
    .join('\n');

/** The two faces every page sets first; preload them. */
export const fontPreloads = ['/fonts/PPNeueMontreal-Regular.woff2', '/fonts/FoundersGrotesk-Regular.woff2'].map(withBase);
