import shortlist from '../../public/atomsai-pantone-shortlist.json';
import { allColors, type BrandColor } from './colors';

// Retain the supplied choices and their proof status without inferring missing matches.
export const printReference = {
  status: shortlist.status,
  created: shortlist.created,
  reference: shortlist.reference,
};

const selections: Record<string, { hex: string; choice: string; note: string }> = shortlist.selections;
for (const [key, selection] of Object.entries(selections)) {
  const color = allColors.find(c => `C:${c.token}` === key);
  if (!color || color.hex.toUpperCase() !== selection.hex.toUpperCase()) {
    throw new Error(`Pantone shortlist no longer matches palette: ${key}`);
  }
}

export function printMatch(color: BrandColor) {
  const selection = selections[`C:${color.token}`];
  return {
    token: color.token,
    hex: color.hex,
    kind: !selection ? 'unassigned' : selection.choice === 'paper' ? 'paper' : 'pantone',
    choice: selection?.choice ?? null,
    label: !selection ? 'Not shortlisted' : selection.choice === 'paper' ? 'Paper stock' : `PANTONE ${selection.choice}`,
    note: selection?.note ?? '',
    status: selection ? shortlist.status : 'Not shortlisted',
  };
}

export const printMatches = allColors.map(printMatch);
