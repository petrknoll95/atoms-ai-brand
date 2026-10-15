export interface SubSection {
  id: string;
  title: string;
}

export interface Section {
  slug: string;
  title: string;
  href: string;
  subs: SubSection[];
}

const s = (id: string, title: string): SubSection => ({ id, title });

export const sections: Section[] = [
  { slug: 'intro', title: 'Intro', href: '/', subs: [s('about', 'About this guide'), s('contents', 'Contents')] },
  {
    slug: 'logo',
    title: 'Logo',
    href: '/logo/',
    subs: [
      s('mark', 'Mark'),
      s('logotype', 'Logotype'),
      s('clear-space', 'Clear space'),
      s('placement', 'Placement'),
      s('minimum-size', 'Minimum size'),
      s('app-icon', 'App icon'),
      s('mark-reveal', 'Mark reveal'),
      s('name-in-copy', 'Name in copy'),
    ],
  },
  {
    slug: 'color',
    title: 'Color',
    href: '/color/',
    subs: [
      s('palette', 'Palette'),
      s('primary', 'Primary'),
      s('secondary', 'Secondary'),
      s('accent', 'Accent'),
      s('shades', 'Shades'),
      s('neutrals', 'Neutrals'),
      s('combinations', 'Combinations'),
      s('gradients', 'Gradients'),
      s('themes', 'Themes'),
    ],
  },
  {
    slug: 'typography',
    title: 'Typography',
    href: '/typography/',
    subs: [
      s('typefaces', 'Typefaces'),
      s('character-set', 'Character set'),
      s('scale', 'Scale & line-height'),
      s('headlines', 'Headlines'),
    ],
  },
  {
    slug: 'icons',
    title: 'Icons',
    href: '/icons/',
    subs: [s('style', 'Style'), s('weight', 'Weight'), s('library', 'Library'), s('in-use', 'In use')],
  },
  {
    slug: 'patterns',
    title: 'Patterns',
    href: '/patterns/',
    subs: [
      s('structures', 'Structures'),
      s('density', 'Density'),
      s('colorways', 'Colorways'),
      s('generator', 'Generator'),
      s('usage', 'Usage'),
    ],
  },
  {
    slug: 'illustration',
    title: 'Illustration',
    href: '/illustration/',
    subs: [s('style', 'Style'), s('linework', 'Linework')],
  },
  {
    slug: 'examples',
    title: 'Examples',
    href: '/examples/',
    subs: [s('social', 'Social'), s('out-of-home', 'Out of home'), s('print', 'Print')],
  },
];

export const section = (slug: string) => {
  const found = sections.find((x) => x.slug === slug);
  if (!found) throw new Error(`Unknown section: ${slug}`);
  return found;
};

export const sectionNumber = (slug: string) => String(sections.findIndex((x) => x.slug === slug) + 1);
