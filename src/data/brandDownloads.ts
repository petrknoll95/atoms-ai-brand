import { colors, assetColors } from './colors';
import { icons, iconWeights } from './icons';
import { appIconSvg, logotypeSvg, markSvg } from './logos';
import { colorize, withStrokeWidth } from '../scripts/svg';

export interface BrandDownload {
  path: string;
  name: string;
  category: 'logo' | 'icon' | 'illustration';
  variant: string;
  svg: string;
}

const illustrations = import.meta.glob<string>('../assets/brand/illustration/*.svg', {
  eager: true, query: '?raw', import: 'default',
});

// Static routes reuse the existing masters. No copied files or second drawing library to sync.
export const brandDownloads: BrandDownload[] = [
  ...Object.entries({ mark: markSvg, logotype: logotypeSvg }).flatMap(([name, svg]) => [
    { path: `logo/${name}.svg`, name, category: 'logo' as const, variant: 'currentColor master', svg },
    ...assetColors.map((key) => ({
      path: `logo/${name}-${colors[key].token}.svg`, name, category: 'logo' as const,
      variant: colors[key].name, svg: colorize(svg, colors[key].hex),
    })),
  ]),
  ...(['square', 'circle'] as const).map((shape) => ({
    path: `logo/app-icon-${shape}.svg`, name: `App icon, ${shape}`, category: 'logo' as const,
    variant: 'Cream on Deep green', svg: appIconSvg(shape),
  })),
  ...iconWeights.flatMap((weight) => icons.map(({ name, svg }) => ({
    path: `icons/${weight.key}/${name}.svg`, name, category: 'icon' as const,
    variant: `${weight.key}, currentColor`, svg: withStrokeWidth(svg, weight.value),
  }))),
  ...Object.entries(illustrations).map(([file, svg]) => {
    const name = file.split('/').pop()!.replace('.svg', '');
    const opaque = svg.includes('SURFACE');
    return {
      path: `illustration/${name}.svg`, name, category: 'illustration' as const,
      variant: opaque ? 'Deep green on White, opaque linework' : 'Black, concept drawing',
      svg: colorize(svg, opaque ? colors.deepGreen.hex : colors.black.hex, colors.white.hex),
    };
  }),
];
