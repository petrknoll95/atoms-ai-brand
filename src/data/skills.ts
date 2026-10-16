import type { MarkdownInstance } from 'astro';
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

const catalog = [
  {
    slug: 'atomsai-brand',
    title: 'AtomsAI brand',
    summary: 'The complete brand system, ready for your agent. From the first headline to the final export.',
    covers: ['Identity & voice', 'Logo', 'Color', 'Typography', 'Patterns', 'Illustration', 'Motion'],
    example: 'Use the AtomsAI brand skill to create a client proposal deck. Follow the logo, color and typography rules, and use the linked assets.',
  },
  {
    slug: 'atomsai-icons',
    title: 'Icon creation',
    summary: 'Extend the icon library with the same precise strokes, sharp corners and deliberate open gaps.',
    covers: ['24 px grid', 'Two weights', 'Open gaps', 'SVG examples', 'Geometry', 'Export checks'],
    example: 'Use the AtomsAI icon creation skill to draw a download icon. Deliver editable Regular and Medium SVGs and compare them with the existing arrow icons.',
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
  return {
    ...entry,
    ...document.frontmatter,
    markdown,
    bytes: new TextEncoder().encode(markdown).length,
    download: withBase(`/skills/${entry.slug}/SKILL.md`),
    filename: `${entry.slug}.md`,
    // The trusted, repository-owned Markdown is compiled by Astro at build time. No browser
    // Markdown parser or HTML from uploads is involved. Scope heading IDs across both previews.
    async previewHtml() {
      return forPublication(await document.compiledContent())
        .replace(/(<\/?h)([1-6])(?=[\s>])/g, (_, tag, level) => `${tag}${Math.min(6, Number(level) + 2)}`)
        .replace(/\bid="([^"]+)"/g, `id="${entry.slug}-$1"`)
        .replace(/href="#([^"]+)"/g, `href="#${entry.slug}-$1"`)
        .replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="Skill reference table"><table>')
        .replace(/<\/table>/g, '</table></div>');
    },
  };
});

export type BrandSkill = (typeof skills)[number];
