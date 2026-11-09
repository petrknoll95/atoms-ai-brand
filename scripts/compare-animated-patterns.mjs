import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium, expect } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const toolURL = process.env.PATTERN_TOOL_URL || 'http://127.0.0.1:4323/atoms-ai-brand/tools/animated-patterns/';
const websiteURL = process.env.PATTERN_WEBSITE_URL || 'http://127.0.0.1:3001/patterns/motion';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 1400 }, reducedMotion: 'reduce' });
const tool = await context.newPage(), website = await context.newPage();
const out = 'docs/animated-patterns'; await mkdir(out, { recursive: true });
const results = [];
try {
  await tool.goto(toolURL, { waitUntil: 'networkidle' });
  await website.goto(websiteURL, { waitUntil: 'networkidle' });
  const a = tool.locator('[data-motion-canvas]'), b = website.locator('canvas');
  for (const c of [a, b]) {
    await c.evaluate(canvas => { canvas.style.width = '512px'; canvas.style.height = '512px'; canvas.style.maxWidth = 'none'; });
    await c.scrollIntoViewIfNeeded();
    await expect(c).toHaveAttribute('data-render-state', 'ready');
  }
  for (const [label, kind] of [['Drift', 'drift'], ['Offset', 'offset'], ['Single band', 'single-band'], ['Concentric', 'concentric']]) {
    await tool.getByLabel('Structure', { exact: true }).selectOption({ label });
    await website.getByLabel('Pattern family').selectOption(kind);
    for (const [colorway, palette] of [['Forest dark', 'forest-dark'], ['Forest light', 'forest-light']]) {
      await tool.getByLabel('Colorway', { exact: true }).selectOption({ label: colorway });
      await website.getByLabel('Palette', { exact: true }).selectOption(palette);
      await tool.getByLabel('Loop position (%)', { exact: true }).fill('25');
      await tool.getByLabel('Loop position (%)', { exact: true }).press('Enter');
      await website.getByRole('slider', { name: 'Loop position', exact: true }).evaluate(el => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, '25');
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      for (const c of [a, b]) { await c.scrollIntoViewIfNeeded(); await expect(c).toHaveAttribute('data-phase', '0.250000'); }
      const capture = c => c.evaluate(canvas => ({ width: canvas.width, height: canvas.height, png: canvas.toDataURL().split(',')[1] }));
      const left = await capture(a), right = await capture(b);
      assert.equal(left.width, 512); assert.equal(right.width, 512);
      assert.equal(left.height, 512); assert.equal(right.height, 512);
      assert.equal(left.png, right.png, `${kind}/${palette} matches website at 25%`);
      const hash = createHash('sha256').update(left.png).digest('hex');
      results.push({ kind, palette, phase: 0.25, width: 512, height: 512, identicalPNG: true, sha256: hash });
      if (palette === 'iris') {
        await writeFile(`${out}/${kind}-brand.png`, Buffer.from(left.png, 'base64'));
        await writeFile(`${out}/${kind}-website.png`, Buffer.from(right.png, 'base64'));
      }
    }
  }
  await writeFile(`${out}/website-comparison.json`, JSON.stringify({ toolURL, websiteURL, results }, null, 2) + '\n');
  console.log(`All ${results.length} frame comparisons are byte-identical to the website at 512 × 512.`);
} finally { await browser.close(); }
