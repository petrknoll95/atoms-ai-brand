import type { APIRoute, GetStaticPaths } from 'astro';
import { readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { withBase } from '../../../../data/base';
import { printPatternFiles, printPatternRoot } from '../../../../data/printPatterns';

const files = new Set(printPatternFiles());
const contentTypes: Record<string, string> = {
  '.ai': 'application/postscript', '.pdf': 'application/pdf',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.html': 'text/html; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

export const getStaticPaths: GetStaticPaths = () => [...files].map((file) => ({ params: { file } }));

export const GET: APIRoute = ({ params }) => {
  if (!params.file || !files.has(params.file)) return new Response(null, { status: 404 });
  const source = readFileSync(join(printPatternRoot, params.file));
  // Keep the repository's standalone catalog usable when mounted under the site's base path.
  const body = params.file === 'catalog.html'
    ? source.toString('utf8').replaceAll('../../../public/fonts/', withBase('/fonts/'))
    : new Uint8Array(source);
  return new Response(body, { headers: { 'Content-Type': contentTypes[extname(params.file)] } });
};
