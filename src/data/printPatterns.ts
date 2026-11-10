/** Build-time access to the reviewed print library; never import this module in client code. */
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import inventory from '../../assets/print/patterns/inventory.json';
import { structures } from './patterns';

export const printPatternRoot = join(process.cwd(), 'assets/print/patterns');
export const printPatternUrl = '/assets/print/patterns';
export const printPatternColorways = ['Forest', 'Sage', 'Graphite', 'Iris'];
const formats = [
  { format: 'AI', suffix: '-cmyk.ai', description: 'Editable CMYK master' },
  { format: 'PDF', suffix: '-cmyk-print.pdf', description: 'CMYK print PDF' },
  { format: 'PNG', suffix: '-preview.png', description: 'RGB preview' },
] as const;

export const printPatterns = inventory.map((entry) => {
  if (entry.status !== 'validated') throw new Error(`Unvalidated print pattern: ${entry.id}`);
  const familyName = structures.find(({ id }) => id === entry.family)?.name;
  if (!familyName) throw new Error(`Unknown print pattern family: ${entry.family}`);
  const density = entry.family === 'concentric' ? `Variant ${entry.density_key}` : `${entry.slits} slits`;
  return {
    id: entry.id, family: entry.family, familyName, colorway: entry.colorway,
    densityKey: entry.density_key, density, name: `${familyName} · ${entry.colorway} · ${density}`,
    files: formats.map((format) => {
      const path = `${entry.family}/${entry.id}${format.suffix}`;
      return { ...format, path, bytes: statSync(join(printPatternRoot, path)).size };
    }),
  };
});

export const printPatternFamilies = structures.map(({ id, name }) => ({
  id, name, variants: printPatterns.filter((pattern) => pattern.family === id),
}));

/** Enumerate real files so the static endpoint cannot expose arbitrary filesystem paths. */
export function printPatternFiles(directory = ''): string[] {
  return readdirSync(join(printPatternRoot, directory), { withFileTypes: true }).flatMap((entry) => {
    const path = directory ? `${directory}/${entry.name}` : entry.name;
    if (entry.isDirectory()) return printPatternFiles(path);
    return entry.isFile() && /\.(ai|pdf|png|jpg|html|md|json|txt)$/.test(entry.name) ? [path] : [];
  }).sort();
}

export const printPatternFileSize = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;
