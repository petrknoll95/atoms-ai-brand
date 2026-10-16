// Validate the delivered site, not an independently maintained copy of the skill data.
// Run after npm run build. No network requests or browser dependencies required.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { strFromU8, unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const read = (path) => readFile(path, 'utf8');
const manifest = JSON.parse(await read(join(dist, 'assets/brand/manifest.json')));
const site = new URL(manifest.guidelines);
const skillNames = ['atomsai-brand', 'atomsai-icons'];
const pages = new Map(await Promise.all(['skills/', ...skillNames.map((name) => `skills/${name}/`)]
  .map(async (path) => [path, await read(join(dist, path, 'index.html'))])));
const library = pages.get('skills/');
assert(!library.includes('data-skill-source'), 'Library should link to separate skill pages');
const archive = unzipSync(await readFile(join(dist, 'skills/atomsai-skills.zip')));
const decode = (text) => text.replace(/&(amp|lt|gt|quot|#39|#x27);/g, (entity) => ({
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'",
})[entity]);
const copyPayloads = [];
for (const [path, page] of pages) {
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((m) => m[1]);
  assert.equal(new Set(ids).size, ids.length, `${path} contains duplicate IDs`);
  const payloads = [...page.matchAll(/<textarea\b[^>]*data-skill-source[^>]*>([\s\S]*?)<\/textarea>/g)]
    .map((m) => decode(m[1]));
  if (path !== 'skills/') assert.equal(payloads.length, 1, `${path} should contain one skill`);
  copyPayloads.push(...payloads);
}
const checkedUrls = new Set();

async function checkUrl(href) {
  const url = new URL(href, site);
  if (url.origin !== site.origin) return;
  if (checkedUrls.has(url.href)) return;
  checkedUrls.add(url.href);
  assert(url.pathname.startsWith(site.pathname), `Link loses the site base: ${href}`);
  const relative = decodeURIComponent(url.pathname.slice(site.pathname.length));
  let path = resolve(dist, relative || '.');
  assert(path === dist || path.startsWith(`${dist}/`), `Link escapes build output: ${href}`);
  if ((await stat(path)).isDirectory()) path = join(path, 'index.html');
  const content = await readFile(path);
  assert(content.length > 0, `Empty download: ${href}`);
  if (url.hash && path.endsWith('.html')) {
    const anchor = decodeURIComponent(url.hash.slice(1));
    assert(content.toString().includes(`id="${anchor}"`), `Missing anchor: ${href}`);
  }
}

const delivered = {};
for (const name of skillNames) {
  const source = await read(join(root, 'skills', name, 'SKILL.md'));
  const markdown = await read(join(dist, 'skills', name, 'SKILL.md'));
  const { frontmatter, content } = parseFrontmatter(markdown);
  assert.equal(frontmatter.name, name);
  assert.match(frontmatter.name, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  assert(frontmatter.name.length <= 64);
  assert(typeof frontmatter.description === 'string' && frontmatter.description.length > 0 && frontmatter.description.length <= 1024);
  assert(Object.values(frontmatter.metadata).every((value) => typeof value === 'string'));
  assert(content.split('\n').length < 500, `${name} should remain a focused standalone skill`);
  assert.equal(markdown, source.replaceAll('https://petrknoll95.github.io/atoms-ai-brand/', site.href));
  assert.equal(strFromU8(archive[`${name}/SKILL.md`]), markdown, `ZIP differs from Markdown: ${name}`);
  assert(copyPayloads.includes(markdown), `Clipboard payload differs from download: ${name}`);
  assert(library.includes(`href="${site.pathname}skills/${name}/"`), `Missing library link: ${name}`);
  await checkUrl(new URL(`skills/${name}/`, site).href);
  assert(!/\{\{[^}]+\}\}|\bTODO\b|localhost:|127\.0\.0\.1/.test(markdown), `Unfinished or local-only content: ${name}`);
  for (const match of markdown.matchAll(/\]\((https?:\/\/[^\s)]+)\)/g)) await checkUrl(match[1]);
  delivered[name] = markdown;
}
assert.deepEqual(Object.keys(archive).sort(), skillNames.map((name) => `${name}/SKILL.md`).sort());
assert.equal(copyPayloads.length, skillNames.length);

const brand = delivered['atomsai-brand'];
for (const c of manifest.palette) {
  assert(brand.includes(`| ${c.token} | ${c.hex} | ${c.rgb.join(', ')} |`), `Skill palette has drifted: ${c.token}`);
  if (c.cmyk) assert(brand.includes(`${c.name} ${c.cmyk.join('/')}`), `CMYK has drifted: ${c.name}`);
}
for (const t of manifest.themes) {
  assert(brand.includes(`| ${t.name} | ${t.background} | ${t.foreground} |`), `Theme has drifted: ${t.name}`);
}
for (const c of manifest.combinations) {
  const names = [c.lead, c.support, c.accent].map((token) => manifest.palette.find((p) => p.token === token).name);
  assert(brand.includes(`| ${names.join(' | ')} |`), `Combination has drifted: ${names.join('/')}`);
}

const masterDir = join(root, 'src/assets/brand/icons');
for (const file of await readdir(masterDir)) {
  if (!file.endsWith('.svg')) continue;
  const master = await read(join(masterDir, file));
  for (const match of master.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)) {
    assert(delivered['atomsai-icons'].includes(match[1]), `Skill geometry has drifted: ${file}`);
  }
  for (const weight of ['regular', 'medium']) {
    const svg = await read(join(dist, 'assets/brand/icons', weight, file));
    assert.equal(svg.trim(), master.replaceAll('stroke-width="1.5"', `stroke-width="${weight === 'regular' ? '1.5' : '2'}"`).trim(), `Export changed master geometry: ${file}`);
  }
}

for (const asset of manifest.assets) {
  await checkUrl(asset.url);
  if (asset.format === 'SVG') {
    const path = new URL(asset.url).pathname.slice(site.pathname.length);
    const svg = await read(join(dist, path));
    assert(!svg.includes('SURFACE'), `Unresolved surface color: ${asset.url}`);
    assert.match(svg, /<svg\b[^>]*\bviewBox="[^"]+"/);
    assert(!/<(?:script|foreignObject|image)\b/i.test(svg), `Unexpected embedded content: ${asset.url}`);
  }
}
await checkUrl(manifest.tokens);
// Check navigation, raw downloads and the HTML preview's source links as delivered.
pages.set('', await read(join(dist, 'index.html')));
for (const [path, page] of pages) {
  for (const match of page.matchAll(/\bhref="([^"]+)"/g)) {
    await checkUrl(new URL(decode(match[1]), new URL(path, site)).href);
  }
}
console.log(`Verified ${skillNames.length} skills, ${manifest.palette.length} colors, ${manifest.themes.length} themes, 15 icon masters, ${manifest.assets.length} assets, ZIP/copy parity and ${checkedUrls.size} local links.`);
