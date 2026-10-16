// "Download all": each asset category bundled into a zip at build time, served at
// /assets/<category>.zip. Files are stored, not deflated (fonts are already compressed).
import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { zipSync } from 'fflate';
import { downloadCategories, fileName } from '../../data/downloads';

export const getStaticPaths: GetStaticPaths = () => downloadCategories.map((c) => ({ params: { category: c.id } }));

export const GET: APIRoute = ({ params }) => {
  const category = downloadCategories.find((c) => c.id === params.category)!;
  const files = Object.fromEntries(
    category.items.map((d) => [fileName(d), new Uint8Array(readFileSync(join(process.cwd(), 'public', d.file)))]),
  );
  const zip = zipSync(files, { level: 0 });
  return new Response(zip, { headers: { 'Content-Type': 'application/zip' } });
};
