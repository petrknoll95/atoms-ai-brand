// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Published on GitHub Pages at petrknoll95.github.io/atoms-ai-brand/. On a custom domain
  // (e.g. brand.atomsai.com) set `site` to it and `base` to '/'.
  site: 'https://petrknoll95.github.io',
  base: '/atoms-ai-brand',
  build: { format: 'directory' },
  vite: {
    // Pre-bundle the client libraries at dev-server start. Otherwise Vite finds them on first use
    // (mediabunny loads lazily), re-optimizes mid-session and pages still holding the old bundle
    // hash fail with "504 Outdated Optimize Dep" (the pattern generator stops loading).
    optimizeDeps: { include: ['tweakpane', 'mediabunny'] },
  },
});
