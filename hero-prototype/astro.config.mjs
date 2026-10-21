// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Pre-bundle p5 at dev-server start so Vite doesn't re-optimize it mid-session.
  vite: { optimizeDeps: { include: ['p5'] } },
});
