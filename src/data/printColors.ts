import pantoneMatches from './pantone-matches.json';
import cmykData from './cmyk-values.json';
import { allColors, type BrandColor } from './colors';

export type PrintStock = 'C' | 'U';
export type Cmyk = [number, number, number, number];
export const printStocks: PrintStock[] = ['C', 'U'];
export const printProfiles = cmykData.profiles;
export const printReference = {
  url: 'https://www.pantone.com/na/en-us/color-finder',
  status: pantoneMatches.status,
  created: pantoneMatches.created,
  updated: pantoneMatches.updated,
  reference: pantoneMatches.reference,
  uncoatedMethod: pantoneMatches.uncoatedMethod,
  substrateReference: pantoneMatches.substrateReference,
  conversion: cmykData.conversion,
  profiles: printProfiles,
  usage: [
    'Proof on the final stock. Use the printer’s required profile if it differs; reconvert from the sRGB originals.',
    'Paper stock supplies Cream, Paper and White in spot-color work. CMYK simulates them on reference white; do not add a tint to already matching stock.',
    'Converted Black is for larger color areas. Use 0/0/0/100 for small black text and fine rules. True-grey conversions are not single-ink tints.',
  ],
};

const selections: Record<string, { hex: string; choice: string; note: string }> = pantoneMatches.selections;
const processColors: Record<string, { hex: string; C: number[]; U: number[] }> = cmykData.colors;

// A palette change must be accompanied by reviewed spot references and regenerated separations.
if (Object.keys(selections).length !== allColors.length * 2 || Object.keys(processColors).length !== allColors.length) {
  throw new Error('Print data must cover exactly the full palette for both stocks.');
}
for (const color of allColors) {
  for (const stock of printStocks) {
    const selected = selections[`${stock}:${color.token}`];
    if (!selected || selected.hex !== color.hex || (selected.choice !== 'paper' && !selected.choice.endsWith(` ${stock}`))) {
      throw new Error(`PANTONE reference missing or stale: ${stock}:${color.token}`);
    }
    cmykFor(color, stock);
  }
}

export function cmykFor(color: BrandColor, stock: PrintStock): Cmyk {
  const entry = processColors[color.token];
  const values = entry?.[stock];
  if (entry?.hex !== color.hex || !values || values.length !== 4 || values.some(v => !Number.isInteger(v) || v < 0 || v > 100)) {
    throw new Error(`ICC conversion missing or stale: ${stock}:${color.token}`);
  }
  return [...values] as Cmyk;
}

export function cmykCopy(color: BrandColor, stock: PrintStock) {
  const profile = printProfiles[stock];
  const label = profile.name.includes(profile.condition) ? profile.name : `${profile.name} (${profile.condition})`;
  return `${cmykFor(color, stock).join('/')}% C/M/Y/K — ${label}; relative colorimetric, black-point compensation`;
}

export function printMatch(color: BrandColor, stock: PrintStock = 'C') {
  const selection = selections[`${stock}:${color.token}`];
  return {
    token: color.token,
    hex: color.hex,
    stock,
    cmyk: cmykFor(color, stock),
    cmykSource: 'ICC profile conversion',
    cmykProfile: printProfiles[stock].file,
    kind: selection.choice === 'paper' ? 'paper' : 'pantone',
    choice: selection.choice,
    label: selection.choice === 'paper' ? 'Paper stock' : `PANTONE ${selection.choice}`,
    note: selection.note,
    status: pantoneMatches.status,
  };
}

/** Shared by swatch menus and role specs, so every copy includes its stock/profile. */
export function printValues(color: BrandColor) {
  return [
    ...printStocks.map(stock => ({
      label: `CMYK ${stock}`, shown: cmykFor(color, stock).join(' / '),
      copy: cmykCopy(color, stock), title: `${printProfiles[stock].name} · ${printProfiles[stock].condition}`,
    })),
    ...printStocks.map(stock => {
      const match = printMatch(color, stock);
      return {
        label: `PANTONE ${stock}`, shown: match.kind === 'paper' ? match.label : match.choice,
        copy: `${match.label} — ${printProfiles[stock].stock}; ${match.status}`, title: match.note || match.status,
      };
    }),
  ];
}

// Keep existing coated fields for manifest consumers; add explicit uncoated data and profiles.
export const printMatches = allColors.map(color => ({ ...printMatch(color), uncoated: printMatch(color, 'U') }));
