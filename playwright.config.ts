import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  use: { baseURL: process.env.FEEDBACK_TEST_URL ?? 'http://127.0.0.1:4330/atoms-ai-brand/', viewport: { width: 1280, height: 900 } },
});
