import type { MarkdownInstance } from 'astro';
import { readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { publishedUrl, withBase } from './base';

interface SkillFrontmatter {
  name: string;
  description: string;
  metadata: { version: string; reviewed: string };
}

const documents = import.meta.glob<MarkdownInstance<SkillFrontmatter>>('../../skills/*/SKILL.md', { eager: true });
const sources = import.meta.glob<string>('../../skills/*/SKILL.md', { eager: true, query: '?raw', import: 'default' });

// Checked-in skills are usable as ordinary standalone files. Generated downloads also follow
// the deployment's site/base if it moves to a custom domain. Never emit localhost asset URLs.
const sourceOrigin = 'https://petrknoll95.github.io/atoms-ai-brand/';
const forPublication = (text: string) => text.replaceAll(sourceOrigin, publishedUrl('/'));

const contentTypes: Record<string, string> = {
  '.md': 'text/markdown; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.ts': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
};

export interface SkillResource {
  path: string;
  contentType: string;
  data: Uint8Array<ArrayBuffer>;
}

// Read only files inside each checked-in skill. The same bytes feed the resource routes and
// archive; binary files never pass through a text decoder. Symlinks cannot publish outside files.
function readResources(directory: string, prefix = ''): SkillResource[] {
  return readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap((entry) => {
    if (entry.isSymbolicLink()) throw new Error(`Skill resources must not be symlinks: ${join(directory, entry.name)}`);
    const path = `${prefix}${entry.name}`;
    if (entry.isDirectory()) return readResources(join(directory, entry.name), `${path}/`);
    if (!entry.isFile()) throw new Error(`Unsupported skill resource: ${path}`);
    const contentType = contentTypes[extname(entry.name).toLowerCase()] ?? 'application/octet-stream';
    const source = readFileSync(join(directory, entry.name));
    const data = contentType.includes('charset=utf-8')
      ? new TextEncoder().encode(forPublication(source.toString('utf8')))
      : new Uint8Array(source);
    return [{ path, contentType, data }];
  });
}

const catalog = [
  {
    slug: 'atomsai-brand',
    title: 'Brand Skill',
    summary: 'Logo, color, typography, imagery, motion and voice.',
    covers: ['Identity & voice', 'Logo', 'Color', 'Typography', 'Patterns', 'Illustration', 'Motion'],
  },
  {
    slug: 'atomsai-icons',
    title: 'Icon Skill',
    summary: 'Grid, strokes, open gaps and SVG construction.',
    covers: ['24 px grid', 'Two weights', 'Open gaps', 'SVG examples', 'Geometry', 'Export checks'],
  },
  {
    slug: 'atomsai-illustrations',
    title: 'Illustration Skill',
    summary: '3D geometry, Iris gradients, linework and interactive previews.',
    covers: ['3D primitives', 'Shared camera', 'Iris edge fades', 'Depth & opacity', 'p5.js previews', 'SVG & PNG export'],
  },
  {
    slug: 'atomsai-photography',
    title: 'Photography Skill',
    summary: 'Editorial photography with character, a sense of place and a reason to look.',
    covers: ['People & presence', 'Light & color', 'Composition', 'Reference edits', 'Image generation', 'Editorial series'],
  },
] as const;

export const skills = catalog.map((entry) => {
  const path = `../../skills/${entry.slug}/SKILL.md`;
  const document = documents[path];
  const source = sources[path];
  if (!document || !source || document.frontmatter.name !== entry.slug) {
    throw new Error(`Missing or incorrectly named skill: ${entry.slug}`);
  }
  const markdown = forPublication(source);
  const resources = readResources(resolve('skills', entry.slug));
  return {
    ...entry,
    ...document.frontmatter,
    markdown,
    bytes: new TextEncoder().encode(markdown).length,
    href: withBase(`/skills/${entry.slug}/`),
    download: withBase(`/skills/${entry.slug}/SKILL.md`),
    filename: `${entry.slug}.md`,
    resources,
    kitDownload: resources.length > 1 ? withBase('/skills/atomsai-skills.zip') : undefined,
    // The trusted, repository-owned Markdown is compiled by Astro at build time. No browser
    // Markdown parser or HTML from uploads is involved. Nest headings below the page and section titles.
    async previewHtml() {
      return forPublication(await document.compiledContent())
        .replace(/(<\/?h)([1-6])(?=[\s>])/g, (_, tag, level) => `${tag}${Math.min(6, Number(level) + 2)}`)
        .replace(/\bid="([^"]+)"/g, `id="${entry.slug}-$1"`)
        .replace(/href="#([^"]+)"/g, `href="#${entry.slug}-$1"`)
        .replace(/\b(href|src)="([^"]+)"/g, (attribute, key, value) => {
          if (/^(?:[a-z][a-z\d+.-]*:|\/|#)/i.test(value)) return attribute;
          const url = new URL(value, publishedUrl(`/skills/${entry.slug}/`));
          return `${key}="${url.pathname}${url.search}${url.hash}"`;
        })
        .replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="Skill reference table"><table>')
        .replace(/<\/table>/g, '</table></div>');
    },
  };
});

export type BrandSkill = (typeof skills)[number];
