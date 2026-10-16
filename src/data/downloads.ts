// The asset hub (/assets/): downloadable files grouped into categories. Each category is also
// bundled into a zip at build time (src/pages/assets/[category].zip.ts).

/** How a file is previewed on its card. */
export type Preview = { kind: 'font'; family: string; weight: number };

export interface Download {
  name: string;
  /** Path of the file under public/. */
  file: string;
  format: string;
  preview: Preview;
}

export interface DownloadCategory {
  id: string;
  title: string;
  description: string;
  /** File name of the category's "Download all" zip. */
  zip: string;
  items: Download[];
}

const font = (name: string, file: string, family: string, weight: number): Download => ({
  name,
  file: `/fonts/${file}`,
  format: 'WOFF2',
  preview: { kind: 'font', family, weight },
});

export const downloadCategories: DownloadCategory[] = [
  {
    id: 'fonts',
    title: 'Fonts',
    description: 'Founders Grotesk for headlines and display type, PP Neue Montreal for body text, in Regular and Medium.',
    zip: 'atomsai-fonts.zip',
    items: [
      font('Founders Grotesk Regular', 'FoundersGrotesk-Regular.woff2', 'var(--font-display)', 400),
      font('Founders Grotesk Medium', 'FoundersGrotesk-Medium.woff2', 'var(--font-display)', 500),
      font('PP Neue Montreal Regular', 'PPNeueMontreal-Regular.woff2', 'var(--font-text)', 400),
      font('PP Neue Montreal Medium', 'PPNeueMontreal-Medium.woff2', 'var(--font-text)', 500),
    ],
  },
];

/** File name of a download, from its path. */
export const fileName = (d: Download) => d.file.split('/').pop()!;
