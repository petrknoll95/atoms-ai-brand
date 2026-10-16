import type { APIRoute } from 'astro';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import { faviconFiles, faviconReadme } from '../../data/favicon';

export const GET: APIRoute = () => {
  const files = Object.fromEntries(faviconFiles.map(({ file }) => [
    file.slice(1), new Uint8Array(readFileSync(join(process.cwd(), 'public', file))),
  ]));
  files['README.md'] = strToU8(faviconReadme);
  return new Response(zipSync(files), { headers: { 'Content-Type': 'application/zip' } });
};
