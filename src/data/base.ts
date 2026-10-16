/**
 * Prefixes a root-relative path with the site's base. On GitHub Pages the site is served from
 * /atoms-ai-brand/ (see `base` in astro.config.mjs), so every internal link and public asset goes
 * through this. Works in pages and in client scripts.
 */
export const withBase = (path: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}${path}`;

/** Absolute URLs for files that leave the website (skills and asset manifests). */
export const publishedUrl = (path: string) => {
  if (!import.meta.env.SITE) throw new Error('Configure Astro site before publishing brand downloads.');
  return new URL(withBase(path), import.meta.env.SITE).href;
};
