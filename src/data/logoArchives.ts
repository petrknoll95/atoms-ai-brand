import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { strToU8, zipSync } from 'fflate';
import manifest from '../../public/logos/manifest.json';

export function logoArchive(variant?: string) {
  const files = manifest.files.filter((file) => !variant || file.variant === variant);
  const entries = Object.fromEntries(files.map((file) => [
    file.path,
    new Uint8Array(readFileSync(join(process.cwd(), 'public/logos', file.path))),
  ]));
  const readme = readFileSync(join(process.cwd(), 'public/logos/README.md'), 'utf8');
  entries['README.md'] = strToU8(variant ? readme.replace('128 files: the full logotype and standalone symbol', `64 files: the ${variant === 'symbol' ? 'standalone symbol' : 'full logotype'}`) : readme);
  entries['manifest.json'] = strToU8(JSON.stringify({ ...manifest, files }, null, 2) + '\n');
  return zipSync(entries, { level: 0, mtime: new Date('2026-01-01T00:00:00Z') });
}
