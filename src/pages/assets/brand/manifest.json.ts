import { photographyAssets, photographyVersion, referenceNotice } from '../../../data/photography';
import { aiInks, aiStates, signalFileName } from '../../../data/aiIdentity';
import { glassSpec } from '../../../data/glass';
import type { APIRoute } from 'astro';
import { publishedUrl } from '../../../data/base';
import { brandDownloads } from '../../../data/brandDownloads';
import { allColors, colors, combinations, contrast, gradientCss, gradients, ramps, rgb, themes } from '../../../data/colors';
import { downloadCategories } from '../../../data/downloads';
import { colorwayNames, DENSITY_STOPS, SLITS, structures } from '../../../data/patterns';
import { printMatches, printReference } from '../../../data/printColors';
import logoManifest from '../../../../public/logos/manifest.json';

export const GET: APIRoute = () => new Response(JSON.stringify({
  schemaVersion: 1,
  guidelines: publishedUrl('/'),
  usage: 'Use official artwork and the written guidelines. Font files are for AtomsAI work. currentColor SVGs need an explicit ink for standalone imports.',
  tokens: publishedUrl('/tokens.css'),
  photographyPackage: {
    version: photographyVersion,
    guidelines: publishedUrl('/photography/'),
    download: publishedUrl('/assets/photography/guidelines.md'),
    usage: referenceNotice,
  },
  aiIdentity: {
    name: 'AtomsAI Signal', guidelines: publishedUrl('/ai-identity/'),
    download: publishedUrl('/assets/ai-identity.zip'),
    guidance: publishedUrl('/assets/ai-identity/README.md'),
    states: publishedUrl('/assets/ai-identity/states.json'),
    reference: publishedUrl('/assets/ai-identity/signal.html'),
    engine: publishedUrl('/assets/ai-identity/signal-engine.js'),
  },
  logoPackage: {
    download: publishedUrl('/assets/logos.zip'),
    manifest: publishedUrl('/logos/manifest.json'),
    guidance: publishedUrl('/logos/README.md'),
    sizes: logoManifest.sizes,
    sizeUnit: logoManifest.sizeUnit,
  },
  glass: {
    ...glassSpec(),
    guidelines: publishedUrl('/glass/'),
    download: publishedUrl('/assets/glass/atomsai-glass.zip'),
    css: publishedUrl('/assets/glass/atomsai-glass.css'),
    json: publishedUrl('/assets/glass/atomsai-glass.json'),
    examples: publishedUrl('/assets/glass/examples.html'),
    guidance: publishedUrl('/assets/glass/README.md'),
  },
  palette: allColors.map((c) => ({ ...c, rgb: rgb(c.hex) })),
  print: { ...printReference, download: publishedUrl('/atomsai-pantone-shortlist.json'), matches: printMatches },
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
    ...photographyAssets().map(({ file, name, format, description }) => ({
      name, category: 'photography', format, description, url: publishedUrl(`/assets/photography/${file}`),
    })),
    ...aiStates.flatMap(state => aiInks.flatMap(ink => [false, true].map(animated => ({
      name: `Signal ${state.name} — ${colors[ink].name}${animated ? ' motion' : ''}`,
      category: 'ai-identity', format: 'SVG', state: state.id, color: colors[ink].token, animated,
      url: publishedUrl(`/assets/ai-identity/${animated ? 'animated' : 'static'}/${signalFileName(state.id, ink, animated)}`),
    })))),
    ...logoManifest.files.map(({ path, ...asset }) => ({
      ...asset, category: 'logo', format: asset.format.toUpperCase(), url: publishedUrl(`/logos/${path}`),
    })),
    ...brandDownloads.map(({ svg: _svg, path, ...asset }) => ({ ...asset, format: 'SVG', url: publishedUrl(`/assets/brand/${path}`) })),
    ...downloadCategories.flatMap((c) => c.items.map((d) => ({
      name: d.name, category: c.id, format: d.format, url: publishedUrl(d.file),
    }))),
  ],
}, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
