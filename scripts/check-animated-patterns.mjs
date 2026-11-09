import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
const { chromium, webkit, expect } = await import(process.env.PLAYWRIGHT_MODULE || '@playwright/test');
const url = process.env.PATTERN_TOOL_URL || 'http://127.0.0.1:4323/atoms-ai-brand/tools/animated-patterns/';
const out = 'docs/animated-patterns';
await mkdir(out, { recursive: true });
const report = { url, results: [] };
const pixels = canvas => canvas.evaluate(c => c.toDataURL());
const seek = async (page, value) => { const input = page.getByLabel('Loop position (%)', { exact: true }); await input.fill(String(value)); await input.press('Enter'); };
for (const [name, engine] of [['chromium', chromium], ['webkit', webkit]]) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const result = { browser: name, checks: [], errors: [] }; report.results.push(result);
  page.on('pageerror', e => result.errors.push(e.message));
  await page.addInitScript(() => {
    // Exercise both copy actions without requiring OS clipboard access in WebKit.
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async text => { window.__copied = text; } }, configurable: true });
  });
  try {
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.addStyleTag({ content: 'astro-dev-toolbar { display: none !important; }' });
    const canvas = page.locator('[data-motion-canvas]');
    await canvas.scrollIntoViewIfNeeded();
    await expect(canvas).toHaveAttribute('data-render-state', 'ready');
    await expect(canvas).toHaveAttribute('data-playback', 'playing');
    const before = await pixels(canvas), allocations = await canvas.getAttribute('data-prepare-count');
    await page.waitForTimeout(700);
    await expect(canvas).toHaveAttribute('data-playback', 'playing');
    assert.notEqual(await pixels(canvas), before);
    assert.equal(await canvas.getAttribute('data-prepare-count'), allocations);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    const paused = await pixels(canvas); await page.waitForTimeout(300); assert.equal(await pixels(canvas), paused);
    result.checks.push('visible animation; cached masks; pause is stable');
    for (const [label, kind] of [['Drift', 'drift'], ['Offset', 'offset'], ['Single band', 'single-band'], ['Concentric', 'concentric']]) {
      await page.getByLabel('Structure', { exact: true }).selectOption({ label });
      await expect(canvas).toHaveAttribute('data-pattern', kind);
      await expect(canvas).toHaveAttribute('data-motion', kind === 'concentric' ? 'ripple' : 'tide');
      await canvas.scrollIntoViewIfNeeded();
      for (const palette of ['Forest dark', 'Forest light', 'Iris']) {
        await page.getByLabel('Colorway', { exact: true }).selectOption({ label: palette });
        await seek(page, 0); const zero = await pixels(canvas);
        await seek(page, 25); const quarter = await pixels(canvas);
        assert.notEqual(quarter, zero, `${kind}/${palette} changes`);
        await seek(page, 100); assert.equal(await pixels(canvas), zero, `${kind}/${palette} loops`);
      }
    }
    result.checks.push('all four structures and three palettes render and loop exactly');
    await page.getByRole('button', { name: 'Replay from start', exact: true }).click();
    await expect(canvas).toHaveAttribute('data-playback', 'playing');
    assert.ok(Number(await canvas.getAttribute('data-phase')) < 0.15);
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
    await seek(page, 25);
    await page.getByRole('button', { name: 'Copy component name', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__copied), 'MotionPattern');
    await page.getByRole('button', { name: 'Copy configured snippet', exact: true }).click();
    assert.equal(await page.evaluate(() => window.__copied), await page.locator('[data-motion-code]').textContent());
    assert.match(await page.evaluate(() => window.__copied), /motion="ripple"/);
    result.checks.push('replay resets loop; both clipboard actions contain correct values');
    await page.getByLabel('Compare still', { exact: true }).locator('..').click();
    await expect(page.getByLabel('Compare still', { exact: true })).toBeChecked();
    const still = await pixels(canvas);
    await seek(page, 50); assert.equal(await pixels(canvas), still);
    await page.getByLabel('Compare still', { exact: true }).locator('..').click();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await expect(canvas).toHaveAttribute('data-playback', 'reduced');
    await expect(page.getByRole('button', { name: 'Replay from start', exact: true })).toBeDisabled();
    await seek(page, 25); await expect(canvas).toHaveAttribute('data-phase', '0.250000');
    result.checks.push('compare still; reduced motion disables autoplay and preserves frame inspection');
    await page.screenshot({ path: `${out}/${name}-desktop.png`, fullPage: true });
    for (const width of [768, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.locator('[data-motion-tool] .preview')).toHaveCSS('display', 'contents');
      await canvas.scrollIntoViewIfNeeded();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect.poll(() => page.evaluate(() => document.querySelector('[data-motion-pane]').getBoundingClientRect().top < document.querySelector('[data-motion-code]').getBoundingClientRect().top)).toBe(true);
      if (width === 390) await page.screenshot({ path: `${out}/${name}-mobile.png`, fullPage: true });
    }
    result.checks.push('no overflow at 768, 390, 320px');
    await page.setViewportSize({ width: 1440, height: 1100 });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await canvas.scrollIntoViewIfNeeded();
    await page.getByRole('button', { name: 'Replay from start', exact: true }).click();
    await page.evaluate(() => document.querySelector('[data-motion-tool]').style.marginTop = '2000px');
    await expect(canvas).toHaveAttribute('data-playback', 'paused');
    const stopped = await canvas.getAttribute('data-motion-frames'); await page.waitForTimeout(300);
    assert.equal(await canvas.getAttribute('data-motion-frames'), stopped);
    await page.evaluate(() => document.querySelector('[data-motion-tool]').style.marginTop = '');
    await canvas.scrollIntoViewIfNeeded(); await expect(canvas).toHaveAttribute('data-playback', 'playing');
    result.checks.push('offscreen suspends draws and resumes');
    // Context recovery uses a new renderer and restores the selected settings.
    const canLose = await canvas.evaluate(c => { const ext = c.getContext('webgl2').getExtension('WEBGL_lose_context'); if (!ext) return false; window.__contextExtension = ext; ext.loseContext(); return true; });
    if (canLose) {
      await expect(canvas).toHaveAttribute('data-render-state', 'lost');
      await page.evaluate(() => window.__contextExtension.restoreContext());
      await expect(canvas).toHaveAttribute('data-render-state', 'ready');
      result.checks.push('WebGL context loss and recovery');
    }
    assert.deepEqual(result.errors, []);
  } finally { await browser.close(); }
}
await writeFile(`${out}/checks.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
