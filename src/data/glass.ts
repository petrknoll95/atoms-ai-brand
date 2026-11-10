import { colors, rgb, contrast } from './colors';

export const glassSource = {
  fileKey: '71GQknySbCroHLUwJYdAn2',
  url: 'https://www.figma.com/design/71GQknySbCroHLUwJYdAn2/AtomsAI-Brand',
  implementation: 'Simplified static version of the CSS supplied by the user, in the AtomsAI palette.',
};
export const figmaLink = (nodeId: string) => `${glassSource.url}?node-id=${nodeId.replace(':', '-')}`;
export const glassExamples = [
  { id: 'post', name: 'Social post', panelNodeId: '1157:14617' },
  { id: 'banner', name: 'Banner', panelNodeId: '1127:34319' },
];
export const glassTreatment = {
  fill: colors.white.hex,
  fillOpacities: [0.1, 0.3, 0.1],
  fillAngle: -75,
  sheenAngle: -45,
  reflectionOpacity: 0.15,
  rimAngle: -75,
  blur: '0.375em',
  rim: '0.0625em',
  insetBlur: '0.25em',
  innerRimBlur: '0.4em',
  innerRimOpacity: 0.1,
  lowerHighlightOpacity: 0.3,
  darkRimOpacity: 0.2,
  edgeLightOpacity: 0.5,
  shadow: `0 0.25em 0.125em -0.125em rgb(${rgb(colors.black.hex).join(' ')} / 20%)`,
};
export const darkGlassTreatment = {
  ...glassTreatment,
  fill: colors.black.hex,
  fillOpacities: [0.25, 0.4, 0.25],
  reflectionOpacity: 0.06,
  innerRimOpacity: 0.02,
  lowerHighlightOpacity: 0.06,
  edgeLightOpacity: 0.08,
};

const white = rgb(colors.white.hex).join(' ');
const shade = rgb(colors.black.hex).join(' ');

// A broad, rounded reflection with zero slope at both ends and at its peak.
const makeReflectionStops = (opacity: number) => Array.from({ length: 17 }, (_, index) => ({
  position: 5 + index * 5,
  opacity: Number((opacity * (1 - Math.cos(2 * Math.PI * index / 16)) / 2).toFixed(5)),
}));
const reflectionStops = makeReflectionStops(glassTreatment.reflectionOpacity);
const darkReflectionStops = makeReflectionStops(darkGlassTreatment.reflectionOpacity);
const reflectionGradient = (stops: typeof reflectionStops) => `linear-gradient(-45deg, ${stops.map(stop => `rgb(${white} / ${Number((stop.opacity * 100).toFixed(3))}%) ${stop.position}%`).join(', ')})`;
const fillGradient = (treatment: typeof glassTreatment) => `linear-gradient(${treatment.fillAngle}deg, ${treatment.fillOpacities.map(opacity => `rgb(${rgb(treatment.fill).join(' ')} / ${opacity * 100}%)`).join(', ')})`;

// Shared verbatim by the page, clipboard and download. Preserve the supplied
// reference's separate shadow, inset lighting, screen reflection and conic rim.
// Only static states are included; every material dimension scales in em.
export const glassCss = () => `/* AtomsAI glass — static CSS, adapted from the supplied reference.
   Set font-size on atoms-glass-wrap to scale the complete material.
   Set --glass-radius to match the component; pill, light and dark are optional. */
.atoms-glass-wrap {
  --glass-blur: ${glassTreatment.blur};
  --glass-rim: ${glassTreatment.rim};
  --glass-ink: ${colors.cream.hex};
  --glass-fallback: ${colors.deepGreen.hex};
  --glass-fill: ${fillGradient(glassTreatment)};
  --glass-reflection: ${reflectionGradient(reflectionStops)};
  --glass-lower-light: ${glassTreatment.lowerHighlightOpacity * 100}%;
  --glass-inner-light: ${glassTreatment.innerRimOpacity * 100}%;
  --glass-edge-light: ${glassTreatment.edgeLightOpacity * 100}%;
  position: relative;
  z-index: 2;
  border-radius: var(--glass-radius, 0.6em);
  background: transparent;
  font: inherit;
  pointer-events: none;
}
.atoms-glass {
  position: relative;
  z-index: 3;
  box-sizing: border-box;
  border: 0;
  border-radius: inherit;
  color: var(--glass-ink);
  background: var(--glass-fallback);
  font: inherit;
  text-decoration: none;
  pointer-events: auto;
}
.atoms-glass-wrap, .atoms-glass, .atoms-glass__content,
.atoms-glass__shadow, .atoms-glass__shadow::after,
.atoms-glass::after, .atoms-glass__content::after {
  animation: none;
  transition: none;
}
.atoms-glass--pill { --glass-radius: 999em; }
.atoms-glass--light {
  --glass-ink: ${colors.deepGreen.hex};
  --glass-fallback: ${colors.cream.hex};
}
.atoms-glass--dark {
  --glass-ink: ${colors.cream.hex};
  --glass-fallback: ${colors.forestShade.hex};
  --glass-fill: ${fillGradient(darkGlassTreatment)};
  --glass-reflection: ${reflectionGradient(darkReflectionStops)};
  --glass-lower-light: ${darkGlassTreatment.lowerHighlightOpacity * 100}%;
  --glass-inner-light: ${darkGlassTreatment.innerRimOpacity * 100}%;
  --glass-edge-light: ${darkGlassTreatment.edgeLightOpacity * 100}%;
  color-scheme: dark;
}
.atoms-glass__content {
  position: relative;
  border-radius: inherit;
  padding: 0.875em 1.5em;
  text-shadow: none;
}
.atoms-glass__content > * { position: relative; z-index: 4; }
.atoms-glass__shadow { display: none; }
.atoms-glass:focus-visible {
  outline: 0.1em solid var(--glass-ink);
  outline-offset: 0.2em;
}
@supports ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  /* The reference's separate, blurred shadow ring. */
  .atoms-glass__shadow {
    --shadow-cutoff: 2em;
    display: block;
    position: absolute;
    z-index: 0;
    width: calc(100% + var(--shadow-cutoff));
    height: calc(100% + var(--shadow-cutoff));
    top: calc(var(--shadow-cutoff) / -2);
    left: calc(var(--shadow-cutoff) / -2);
    border-radius: inherit;
    filter: blur(0.125em);
    overflow: visible;
    pointer-events: none;
  }
  .atoms-glass__shadow::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(180deg, rgb(${shade} / 20%), rgb(${shade} / 10%));
    width: calc(100% - var(--shadow-cutoff) - 0.25em);
    height: calc(100% - var(--shadow-cutoff) - 0.25em);
    top: calc(var(--shadow-cutoff) - 0.5em);
    left: calc(var(--shadow-cutoff) - 0.875em);
    padding: 0.125em;
    box-sizing: border-box;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
  }
  .atoms-glass {
    background: var(--glass-fill);
    -webkit-backdrop-filter: blur(var(--glass-blur));
    backdrop-filter: blur(var(--glass-blur));
    box-shadow:
      inset 0 0.125em ${glassTreatment.insetBlur} rgb(${shade} / 5%),
      inset 0 -0.125em ${glassTreatment.insetBlur} rgb(${white} / var(--glass-lower-light)),
      ${glassTreatment.shadow},
      inset 0 0 ${glassTreatment.innerRimBlur} 0.25em rgb(${white} / var(--glass-inner-light));
  }
  /* Fixed screen reflection with a broad, eased falloff beneath the label. */
  .atoms-glass__content::after {
    content: "";
    position: absolute;
    z-index: 3;
    inset: calc(var(--glass-rim) / 2);
    border-radius: inherit;
    overflow: clip;
    pointer-events: none;
    background: var(--glass-reflection);
    mix-blend-mode: screen;
    background-size: 200% 200%;
    background-position: 0% 50%;
    background-repeat: no-repeat;
  }
  /* The supplied conic rim with a softened dark edge. */
  .atoms-glass::after {
    content: "";
    position: absolute;
    z-index: 1;
    inset: calc(var(--glass-rim) / -2);
    padding: var(--glass-rim);
    box-sizing: border-box;
    border-radius: inherit;
    pointer-events: none;
    background:
      conic-gradient(from -75deg at 50% 50%,
        rgb(${shade} / ${glassTreatment.darkRimOpacity * 100}%), transparent 5% 40%,
        rgb(${shade} / ${glassTreatment.darkRimOpacity * 100}%) 50%, transparent 60% 95%, rgb(${shade} / ${glassTreatment.darkRimOpacity * 100}%)),
      linear-gradient(180deg, rgb(${white} / var(--glass-edge-light)), rgb(${white} / var(--glass-edge-light)));
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
    mask-composite: exclude;
    box-shadow: inset 0 0 0 calc(var(--glass-rim) / 2) rgb(${white} / var(--glass-edge-light));
  }
}
/* Keep an opaque option for busy backdrops and accessibility preferences. */
.atoms-glass--solid .atoms-glass {
  background: var(--glass-fallback);
  box-shadow: none;
  -webkit-backdrop-filter: none;
  backdrop-filter: none;
}
.atoms-glass--solid .atoms-glass__shadow,
.atoms-glass--solid .atoms-glass__content::after,
.atoms-glass--solid .atoms-glass::after { display: none; }
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more), print {
  .atoms-glass {
    background: var(--glass-fallback); box-shadow: none;
    -webkit-backdrop-filter: none; backdrop-filter: none;
  }
  .atoms-glass__shadow, .atoms-glass__content::after, .atoms-glass::after { display: none; }
}
@media (forced-colors: active) {
  .atoms-glass, .atoms-glass--solid .atoms-glass {
    color: CanvasText; background: Canvas; border: 0.0625em solid CanvasText;
    box-shadow: none; -webkit-backdrop-filter: none; backdrop-filter: none;
  }
  .atoms-glass__shadow, .atoms-glass__content::after, .atoms-glass::after { display: none; }
}
`;

// Flat-background bounds: white fill at 10–30%, followed by white sheen at 0–15%.
export const composite = (backdrop: string, opacity: number, sheen = 0, fill = colors.white.hex) => '#' + rgb(fill).map((v, i) => {
  const base = v * opacity + rgb(backdrop)[i] * (1 - opacity);
  return Math.round(rgb(colors.white.hex)[i] * sheen + base * (1 - sheen)).toString(16).padStart(2, '0');
}).join('').toUpperCase();
export const readableBackgrounds = [colors.cream, colors.stone].map(c => {
  const ratio = Math.min(...[.1, .3].flatMap(alpha => [0, glassTreatment.reflectionOpacity].map(sheen => contrast(colors.deepGreen.hex, composite(c.hex, alpha, sheen)))));
  return { ...c, ratio, passes: ratio >= 4.5 };
});
export const darkReadableBackgrounds = [colors.deepGreen, colors.forestGreen].map(c => {
  const ratio = Math.min(...[.25, .4].flatMap(alpha => [0, darkGlassTreatment.reflectionOpacity].map(sheen => contrast(colors.cream.hex, composite(c.hex, alpha, sheen, colors.black.hex)))));
  return { ...c, ratio, passes: ratio >= 4.5 };
});
export const ratioLabel = (ratio: number) => `${(Math.floor(ratio * 100) / 100).toFixed(2)}:1`;

export const glassSpec = () => ({
  schemaVersion: 4,
  source: glassSource,
  treatment: glassTreatment,
  darkMode: {
    className: 'atoms-glass--dark',
    treatment: darkGlassTreatment,
    text: colors.cream.hex,
    fallback: colors.forestShade.hex,
    reflectionFalloff: { curve: 'cosine', stops: darkReflectionStops },
    readability: { combinations: darkReadableBackgrounds, note: 'Flat backgrounds, Black fill 25–40% and White reflection 0–6%; Cream labels sit above the reflection.' },
  },
  examples: glassExamples.map(example => ({ ...example, sourceUrl: figmaLink(example.panelNodeId) })),
  units: 'CSS em relative to the wrapper font size. All material dimensions scale together without pixel limits.',
  corners: { property: '--glass-radius', fallback: '0.6em', guidance: 'Match the component shape; any valid CSS border-radius value is supported.' },
  at20px: { blur: 7.5, rim: 1.25, shadow: { x: 0, y: 5, blur: 2.5, spread: -2.5, color: colors.black.hex, opacity: .2 } },
  insetShadows: [
    { x: 0, y: '.125em', blur: glassTreatment.insetBlur, color: colors.black.hex, opacity: .05 },
    { x: 0, y: '-.125em', blur: glassTreatment.insetBlur, color: colors.white.hex, opacity: glassTreatment.lowerHighlightOpacity },
    { x: 0, y: 0, blur: glassTreatment.innerRimBlur, spread: '.25em', color: colors.white.hex, opacity: glassTreatment.innerRimOpacity },
  ],
  detachedShadow: { color: colors.black.hex, opacities: [.2, .1], blur: '.125em', ringWidth: '.125em', offsetX: '.125em', offsetY: '.5em' },
  textShadow: 'none',
  reflectionOpacity: glassTreatment.reflectionOpacity,
  reflectionFalloff: { curve: 'cosine', stops: reflectionStops },
  motion: 'none — no animated properties, transitions, hover transforms or active-state rotation',
  readability: { combinations: readableBackgrounds, note: 'Flat-background text-interior bounds include fill plus sheen (White fill 10–30%, White reflection 0–15%). Labels sit above the reflection. Check actual patterns and edge effects separately.' },
});

export const glassReadme = () => `# AtomsAI glass — CSS

The supplied glass-button CSS in its static rest state: translucent white fill, backdrop blur, inset lighting, a screen reflection, conic rim, contact shadow and a separate blurred shadow ring. All material dimensions use em and scale with the wrapper's font size. Text remains live HTML. No panel images, animation, transitions, hover scaling or rotation.

## Values

- Fill: White ${colors.white.hex}, 10% → 30% → 10%, at −75°.
- Blur: ${glassTreatment.blur}.
- Rim: 0.0625em. White 50% with a −75° conic edge in Black ${glassTreatment.darkRimOpacity * 100}% and a half-width inner highlight.
- Reflection: fixed −45° gradient, up to ${glassTreatment.reflectionOpacity * 100}% White, with a broad cosine falloff from 5% to 85% and a soft peak at 45%. Screen blended beneath the label.
- Contact shadow: ${glassTreatment.shadow}.
- Detached shadow: a 0.125em ring in Black 20% → 10%, blurred by 0.125em and offset 0.125em right / 0.5em down.
- Inset lighting: 0 / 0.125em / ${glassTreatment.insetBlur} Black 5%; 0 / −0.125em / ${glassTreatment.insetBlur} White ${glassTreatment.lowerHighlightOpacity * 100}%; 0 / 0 / ${glassTreatment.innerRimBlur} / 0.25em White ${glassTreatment.innerRimOpacity * 100}%. The inner rim diffuses gradually into the surface.
- Contents: no shadows on text, icons or other content. Shadows belong to the glass surface.
- Corners: match the component shape. Set --glass-radius to any CSS border-radius value; 0.6em is only the fallback, and the pill class is optional.
- Text: opaque Cream on dark backgrounds, Deep green on light backgrounds.

## Dark mode

Add atoms-glass--dark to the wrapper. Dark glass uses Black at ${darkGlassTreatment.fillOpacities.map(opacity => `${opacity * 100}%`).join(' → ')}, Cream text, a White rim at ${darkGlassTreatment.edgeLightOpacity * 100}%, a ${darkGlassTreatment.reflectionOpacity * 100}% eased reflection, a ${darkGlassTreatment.lowerHighlightOpacity * 100}% lower highlight and a ${darkGlassTreatment.innerRimOpacity * 100}% inner glow. Blur, dimensions and black shadows are shared with light glass. The opaque fallback is Forest shade. The modifier is explicit, so it can follow the host application's theme without changing light examples.

## Use

\`\`\`html
<link rel="stylesheet" href="atomsai-glass.css">
<div class="atoms-glass-wrap" style="font-size: 1.5rem; --glass-radius: 1.2em">
  <span class="atoms-glass__shadow" aria-hidden="true"></span>
  <div class="atoms-glass">
    <div class="atoms-glass__content"><span>How much autonomy should an agent have?</span></div>
  </div>
</div>
\`\`\`

Set the wrapper's font size and width in your layout. Blur, rim, shadows, highlights, padding and default corners scale together, with no pixel clamps. Add atoms-glass--pill, atoms-glass--light, atoms-glass--dark or atoms-glass--solid to the wrapper as needed. Keep the label in a child element so it stays above the reflection. Use a flat brand fill, official interference pattern or approved brand gradient. The site's light and dark inputs use flat Mist and Forest green; the empty cards use the same canvas pattern for comparison.

## Readability

The reflection changes contrast as well as the base fill. The light combinations use Deep green text above the reflection; minimum fill-plus-reflection ratios are ${readableBackgrounds.map(c => `${c.name} ${ratioLabel(c.ratio)}`).join(', ')}. These bounds describe flat sRGB backdrops, not every pattern or the rim. Check the final text area against 4.5:1 for normal text. Use solid mode when a crop or highlight does not pass.

Dark glass uses Cream text; minimum fill-plus-reflection ratios are ${darkReadableBackgrounds.map(c => `${c.name} ${ratioLabel(c.ratio)}`).join(', ')}. Its weaker reflection keeps light text readable over dark fills.

Unsupported backdrop-filter, reduced transparency, increased contrast and print use opaque fills; forced colors use the system palette. Pseudo-elements never intercept clicks. Interactive uses retain a visible keyboard focus ring.

## Package

CSS, JSON settings, a self-contained HTML demo with real CSS surfaces, and these notes. No PNGs or commercial font files are required. The HTML uses installed brand fonts, falling back to Arial.

Figma informed the palette and compositions: ${glassExamples.map(e => `[${e.name}](${figmaLink(e.panelNodeId)})`).join(', ')}. The supplied CSS defines this web material; it does not simulate physical refraction or dispersion.
`;

export const glassExamplesHtml = () => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>AtomsAI glass CSS</title><style>
${glassCss()}
body { margin: 32px; color: ${colors.deepGreen.hex}; background: ${colors.white.hex}; font: 16px/1.4 'PP Neue Montreal', Arial, sans-serif; }
main { max-width: 1000px; margin: auto; } h1 { font-family: 'Founders Grotesk', Arial, sans-serif; font-weight: 400; }
.previews { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; } figure { margin: 0; min-width: 0; } figcaption { margin-top: 12px; }
.stage { padding: 9%; background: ${colors.mist.hex}; }
.stage.close-up { aspect-ratio: 4 / 3; padding: 0; display: flex; align-items: center; overflow: hidden; container-type: inline-size; }
.stage.close-up .atoms-glass-wrap { flex: 0 0 auto; width: max-content; max-width: none; margin: 0 0 0 18%; font-size: 9cqw; white-space: nowrap; }
.stage.light { background: linear-gradient(180deg, ${colors.cream.hex}, ${colors.stone.hex}); }
.stage.dark { background: ${colors.forestGreen.hex}; }
.stage.card { aspect-ratio: 1; display: grid; place-items: center; box-sizing: border-box; }
.stage.card.dark { background: ${colors.forestGreen.hex}; }
.stage.card .atoms-glass-wrap { width: 100%; }
.atoms-glass-wrap { max-width: 650px; margin: auto; font-size: clamp(18px, 3vw, 28px); }
.atoms-glass__content { display: flex; align-items: center; justify-content: space-between; gap: 1em; }
.empty-card { --glass-radius: 1.5em; }
.empty-card .atoms-glass__content { aspect-ratio: 4 / 3; padding: 0; }
label { display: block; margin-block: 24px; } .note { font-size: 14px; }
@media (max-width: 640px) { .previews { grid-template-columns: minmax(0, 1fr); } }
</style></head><body><main><h1>Glass</h1><p>Live CSS. Fixed highlights. No animation.</p>
<label><input type="checkbox" id="solid"> Solid fallback</label>
<div class="previews">
<figure><div class="stage close-up"><div class="atoms-glass-wrap atoms-glass--pill atoms-glass--light"><span class="atoms-glass__shadow" aria-hidden="true"></span><div class="atoms-glass"><div class="atoms-glass__content"><span>Can an AI agent clear our claims backlog?</span><span aria-hidden="true">↑</span></div></div></div></div><figcaption>Light · input</figcaption></figure>
<figure><div class="stage close-up dark"><div class="atoms-glass-wrap atoms-glass--pill atoms-glass--dark"><span class="atoms-glass__shadow" aria-hidden="true"></span><div class="atoms-glass"><div class="atoms-glass__content"><span>Can an AI agent clear our claims backlog?</span><span aria-hidden="true">↑</span></div></div></div></div><figcaption>Dark · input</figcaption></figure>
<figure><div class="stage card light"><div class="atoms-glass-wrap atoms-glass--light empty-card"><span class="atoms-glass__shadow" aria-hidden="true"></span><div class="atoms-glass"><div class="atoms-glass__content"></div></div></div></div><figcaption>Light · card</figcaption></figure>
<figure><div class="stage card dark"><div class="atoms-glass-wrap atoms-glass--dark empty-card"><span class="atoms-glass__shadow" aria-hidden="true"></span><div class="atoms-glass"><div class="atoms-glass__content"></div></div></div></div><figcaption>Dark · card</figcaption></figure>
</div>
<p class="note">Use a checked backdrop for the final text size. The CSS is embedded here and also included as a separate file.</p>
</main><script>document.querySelector('#solid').addEventListener('change', function () { document.querySelectorAll('.atoms-glass-wrap').forEach(el => el.classList.toggle('atoms-glass--solid', this.checked)); });</script></body></html>`;

export const glassFiles = () => ({
  'atomsai-glass.css': glassCss(),
  'atomsai-glass.json': JSON.stringify(glassSpec(), null, 2) + '\n',
  'examples.html': glassExamplesHtml(),
  'README.md': glassReadme(),
});
