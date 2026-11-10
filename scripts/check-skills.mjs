// Validate the delivered site, not an independently maintained copy of the skill data.
// Run after npm run build. No network requests or browser dependencies required.
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from 'astro/markdown';
import { unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = join(root, 'dist');
const read = (path) => readFile(path, 'utf8');
const manifest = JSON.parse(await read(join(dist, 'assets/brand/manifest.json')));
const site = new URL(manifest.guidelines);
const skillsRoot = join(root, 'skills');
const skillNames = [];
for (const entry of await readdir(skillsRoot, { withFileTypes: true })) {
  if (entry.isDirectory() && (await readdir(join(skillsRoot, entry.name))).includes('SKILL.md')) skillNames.push(entry.name);
}
skillNames.sort();
assert(skillNames.length > 0, 'No skill packages found');
const textExtensions = new Set(['.md', '.mjs', '.js', '.ts', '.json', '.txt', '.css', '.html', '.svg']);
const forPublication = (source) => source.replaceAll('https://petrknoll95.github.io/atoms-ai-brand/', site.href);
async function resourcePaths(directory, prefix = '') {
  const paths = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Skill resources must not be symlinks: ${join(directory, entry.name)}`);
    if (entry.isDirectory()) paths.push(...await resourcePaths(join(directory, entry.name), `${prefix}${entry.name}/`));
    else {
      assert(entry.isFile(), `Unsupported skill resource: ${entry.name}`);
      paths.push(`${prefix}${entry.name}`);
    }
  }
  return paths.sort();
}
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

async function checkMarkdownLinks(markdown, base) {
  // Ignore sample code, then check ordinary links/images, reference definitions and HTML media.
  const prose = markdown.replace(/^\s*(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\s*\1\s*$/gm, '').replace(/`[^`\n]+`/g, '');
  const links = [
    ...[...prose.matchAll(/!?\[[^\]]*\]\(\s*(?:<([^>]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g)].map((match) => match[1] ?? match[2]),
    ...[...prose.matchAll(/^\s*\[[^\]]+\]:\s*<?([^\s>]+)>?/gm)].map((match) => match[1]),
    ...[...prose.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => decode(match[1])),
  ];
  for (const href of links) await checkUrl(new URL(href, base).href);
}

const delivered = {};
const expectedArchivePaths = [];
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
  assert.equal(markdown, forPublication(source));
  assert(copyPayloads.includes(markdown), `Clipboard payload differs from download: ${name}`);
  assert(library.includes(`href="${site.pathname}skills/${name}/"`), `Missing library link: ${name}`);
  await checkUrl(new URL(`skills/${name}/`, site).href);
  assert(!/\{\{[^}]+\}\}|\bTODO\b|localhost:|127\.0\.0\.1/.test(markdown), `Unfinished or local-only content: ${name}`);
  const resources = await resourcePaths(join(skillsRoot, name));
  for (const relative of resources) {
    const archivePath = `${name}/${relative}`;
    expectedArchivePaths.push(archivePath);
    const sourceBytes = await readFile(join(skillsRoot, name, relative));
    const expected = textExtensions.has(extname(relative).toLowerCase())
      ? Buffer.from(forPublication(sourceBytes.toString('utf8')))
      : sourceBytes;
    const published = await readFile(join(dist, 'skills', name, relative));
    assert.deepEqual(published, expected, `Published resource differs from source: ${archivePath}`);
    assert(archive[archivePath], `ZIP is missing ${archivePath}`);
    assert.deepEqual(Buffer.from(archive[archivePath]), published, `ZIP differs from published resource: ${archivePath}`);
    const resourceUrl = new URL(`skills/${archivePath}`, site);
    await checkUrl(resourceUrl.href);
    if (extname(relative).toLowerCase() === '.md') await checkMarkdownLinks(published.toString('utf8'), resourceUrl);
  }
  if (resources.length > 1) {
    assert(pages.get(`skills/${name}/`).includes(`href="${site.pathname}skills/atomsai-skills.zip"`), `Missing kit download: ${name}`);
  }
  delivered[name] = markdown;
}
assert.deepEqual(Object.keys(archive).sort(), expectedArchivePaths.sort(), 'ZIP entries must exactly match the skill package files');
assert.equal(copyPayloads.length, skillNames.length);

const brand = delivered['atomsai-brand'];
for (const c of manifest.palette) {
  assert(brand.includes(`| ${c.token} | ${c.hex} | ${c.rgb.join(', ')} |`), `Skill palette has drifted: ${c.token}`);
}
const printSource = JSON.parse(await read(join(root, 'src/data/pantone-matches.json')));
await assert.rejects(stat(join(dist, 'atomsai-pantone-shortlist.json')), { code: 'ENOENT' });
assert.equal(manifest.print.status, printSource.status);
assert.equal(manifest.print.matches.length, manifest.palette.length);
const cmykSource = JSON.parse(await read(join(root, 'src/data/cmyk-values.json')));
assert.deepEqual(manifest.print.profiles, cmykSource.profiles);
assert.deepEqual(manifest.print.conversion, cmykSource.conversion);
assert.equal(Object.keys(printSource.selections).length, manifest.palette.length * 2);
assert.deepEqual(Object.keys(cmykSource.colors).sort(), manifest.palette.map(c => c.token).sort());
const printDownload = JSON.parse(await read(join(dist, 'assets/brand/print-colors.json')));
assert.deepEqual(printDownload, { schemaVersion: 1, ...manifest.print });
const colorPage = await read(join(dist, 'color/index.html'));
assert(!colorPage.includes('CMYK est.') && !colorPage.includes('Not assigned'));
for (const match of manifest.print.matches) {
  const color = manifest.palette.find(c => c.token === match.token);
  assert(color, `Unknown print token: ${match.token}`);
  const process = cmykSource.colors[match.token];
  assert.equal(process.hex, color.hex);
  for (const [stock, entry] of [['C', match], ['U', match.uncoated]]) {
    const selected = printSource.selections[`${stock}:${match.token}`];
    assert(selected, `Missing ${stock} reference: ${match.token}`);
    assert.equal(entry.stock, stock);
    assert.equal(entry.token, color.token);
    assert.equal(entry.choice, selected.choice);
    assert.equal(entry.hex, color.hex);
    assert.equal(selected.hex, color.hex);
    assert.equal(entry.kind, selected.choice === 'paper' ? 'paper' : 'pantone');
    assert(selected.choice === 'paper' || selected.choice.endsWith(` ${stock}`));
    assert.equal(entry.status, printSource.status);
    assert.equal(entry.cmykSource, 'ICC profile conversion');
    assert.equal(entry.cmykProfile, cmykSource.profiles[stock].file);
    assert.deepEqual(entry.cmyk, process[stock]);
    assert.equal(entry.cmyk.length, 4);
    assert(entry.cmyk.every(v => Number.isInteger(v) && v >= 0 && v <= 100));
    assert(entry.cmyk.reduce((sum, v) => sum + v, 0) <= 300, `Ink coverage exceeds profile limit: ${match.token}`);
    assert(colorPage.includes(`aria-label="Copy ${color.name} CMYK ${cmykSource.profiles[stock].condition}"`));
    assert(colorPage.includes(`${entry.cmyk.join('/')}% C/M/Y/K — ${cmykSource.profiles[stock].name}`));
  }
  assert(brand.includes(`| ${match.token} | ${match.label} | ${match.uncoated.label} | ${match.cmyk.join('/')} | ${match.uncoated.cmyk.join('/')} |`), `Print skill drift: ${match.token}`);
}
assert.deepEqual(cmykSource.colors.white.C, [0, 0, 0, 0]);
assert.deepEqual(cmykSource.colors.white.U, [0, 0, 0, 0]);
assert.equal(manifest.print.url, 'https://www.pantone.com/na/en-us/color-finder');
assert(!('download' in manifest.print));

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
  for (const match of page.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    await checkUrl(new URL(decode(match[1]), new URL(path, site)).href);
  }
}
console.log(`Verified ${skillNames.length} skills, ${expectedArchivePaths.length} package files, ${manifest.palette.length} colors, ${manifest.themes.length} themes, 15 icon masters, ${manifest.assets.length} assets, ZIP/copy parity and ${checkedUrls.size} local links.`);
