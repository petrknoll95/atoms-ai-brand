import { withBase } from './base';

export interface SubSection {
  id: string;
  title: string;
  /** Separate pages can appear under a section alongside in-page anchors. */
  href?: string;
  /** The section number shown on the page (from the Figma slides, so not always in order). */
  number?: string;
}

export interface Section {
  slug: string;
  title: string;
  href: string;
  subs: SubSection[];
}

const s = (id: string, title: string, number?: string): SubSection => ({ id, title, number });

export const sections: Section[] = [
  { slug: 'intro', title: 'Intro', href: withBase('/'), subs: [s('about', 'About this guide', '1.1'), s('contents', 'Contents', '1.2')] },
  {
    slug: 'logo',
    title: 'Logo',
    href: withBase('/logo/'),
    subs: [
      s('mark', 'Mark', '2.1'),
      s('logotype', 'Logotype', '2.4'),
      s('clear-space', 'Clear space', '2.2'),
      s('placement', 'Placement', '2.3'),
      s('minimum-size', 'Minimum size', '2.8'),
      s('app-icon', 'App icon', '2.11'),
      s('name-in-copy', 'Name in copy', '2.10'),
    ],
  },
  {
    slug: 'color',
    title: 'Color',
    href: withBase('/color/'),
    subs: [
      s('palette', 'Palette', '3.1'),
      s('primary', 'Primary', '3.2'),
      s('secondary', 'Secondary', '3.3'),
      s('accent', 'Accent', '3.4'),
      s('shades', 'Shades', '3.5'),
      s('neutrals', 'Neutrals', '3.6'),
      s('combinations', 'Combinations', '3.7'),
      s('gradients', 'Gradients', '3.8'),
      s('themes', 'Themes', '3.9'),
    ],
  },
  {
    slug: 'typography',
    title: 'Typography',
    href: withBase('/typography/'),
    subs: [
      s('typefaces', 'Typefaces', '5.2'),
      s('character-set', 'Character set', '5.3'),
      s('scale', 'Scale & line-height', '5.4'),
      s('headlines', 'Headlines', '5.5'),
    ],
  },
  {
    slug: 'icons',
    title: 'Icons',
    href: withBase('/icons/'),
    subs: [s('style', 'Style', '6.1'), s('weight', 'Weight', '6.2'), s('library', 'Library', '6.3'), s('in-use', 'In use', '6.4')],
  },
  {
    slug: 'patterns',
    title: 'Patterns',
    href: withBase('/patterns/'),
    subs: [
      s('structures', 'Structures', '4.1'),
      s('density', 'Density', '4.7'),
      s('colorways', 'Colorways', '4.8'),
      s('usage', 'Usage', '4.9'),
    ],
  },
  {
    slug: 'illustration',
    title: 'Illustration',
    href: withBase('/illustration/'),
    subs: [s('style', 'Style', '7.1'), s('linework', 'Linework', '7.2')],
  },
  {
    slug: 'examples',
    title: 'Examples',
    href: withBase('/examples/'),
    subs: [s('social', 'Social', '8.1'), s('out-of-home', 'Out of home', '8.4'), s('print', 'Print', '8.8')],
  },
];

/** Tools, the asset hub and the skills: listed apart in the sidebar, numbered on from the guidelines. */
export const tools: Section[] = [
  {
    slug: 'tools',
    title: 'Tools',
    href: withBase('/tools/'),
    subs: [s('pattern-generator', 'Pattern generator', '9.1'), s('mark-reveal', 'Mark reveal', '9.2')],
  },
  { slug: 'assets', title: 'Assets', href: withBase('/assets/'), subs: [s('logos', 'Logos', '10.1'), s('fonts', 'Fonts', '10.2')] },
  {
    slug: 'skills', title: 'Skills', href: withBase('/skills/'),
    subs: [
      { id: 'atomsai-brand', title: 'Brand Skill', number: '11.1', href: withBase('/skills/atomsai-brand/') },
      { id: 'atomsai-icons', title: 'Icon Skill', number: '11.2', href: withBase('/skills/atomsai-icons/') },
    ],
  },
];

export const section = (slug: string) => {
  const found = [...sections, ...tools].find((x) => x.slug === slug);
  if (!found) throw new Error(`Unknown section: ${slug}`);
  return found;
};

/** 1-based position across the guideline sections, then tools, assets and skills. */
export const sectionNumber = (slug: string) => {
  const index = [...sections, ...tools].findIndex((x) => x.slug === slug);
  return index < 0 ? '' : String(index + 1);
};
