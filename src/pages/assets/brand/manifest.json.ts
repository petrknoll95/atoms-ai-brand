import type { APIRoute } from 'astro';
import { publishedUrl } from '../../../data/base';
import { brandDownloads } from '../../../data/brandDownloads';
import { allColors, colors, combinations, contrast, gradientCss, gradients, ramps, rgb, themes } from '../../../data/colors';
import { downloadCategories } from '../../../data/downloads';
import { colorwayNames, DENSITY_STOPS, SLITS, structures } from '../../../data/patterns';

export const GET: APIRoute = () => new Response(JSON.stringify({
  schemaVersion: 1,
  guidelines: publishedUrl('/'),
  usage: 'Use official artwork and the written guidelines. Font files are for AtomsAI work. currentColor SVGs need an explicit ink for standalone imports.',
  tokens: publishedUrl('/tokens.css'),
  palette: allColors.map((c) => ({ ...c, rgb: rgb(c.hex) })),
  ramps: Object.fromEntries(Object.entries(ramps).map(([name, keys]) => [name, keys.map((key) => colors[key].token)])),
  combinations: combinations.map((keys) => ({
    lead: colors[keys[0]].token, support: colors[keys[1]].token, accent: colors[keys[2]].token,
    proportions: [60, 30, 10],
  })),
  themes: themes.flatMap((theme) => theme.steps.map((step) => ({
    name: `${theme.name} ${step.label}`, background: colors[step.bg].token, foreground: colors[step.fg].token,
    contrast: Number(contrast(colors[step.bg].hex, colors[step.fg].hex).toFixed(2)),
  }))),
  gradients: gradients.map((g) => ({ name: `${colors[g.from].name} → ${colors[g.to].name}`, css: gradientCss(g), stops: g.stops })),
  patterns: {
    generator: publishedUrl('/tools/#pattern-generator'), publishedSlitCounts: SLITS,
    generatorSlitCounts: DENSITY_STOPS, colorways: colorwayNames,
    structures: structures.map(({ id, name, description, densities, colorways }) => ({
      id, name, description, densityIndices: densities, colorways,
    })),
    note: 'Concentric uses only density indices 1 and 2 (10 and 20 in the generator). The generator produces final PNGs; these color recipes alone are not rendered patterns.',
  },
  assets: [
    ...brandDownloads.map(({ svg: _svg, path, ...asset }) => ({ ...asset, format: 'SVG', url: publishedUrl(`/assets/brand/${path}`) })),
    ...downloadCategories.flatMap((c) => c.items.map((d) => ({
      name: d.name, category: c.id, format: d.format, url: publishedUrl(d.file),
    }))),
  ],
}, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
