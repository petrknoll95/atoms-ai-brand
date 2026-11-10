import type { APIRoute, GetStaticPaths } from 'astro';
import { zipSync, strToU8 } from 'fflate';
import { iconUsageAssets, iconUsageReadme, iconUsageFiles } from '../../../data/iconUsage';

export const getStaticPaths: GetStaticPaths = () => [
  ...iconUsageAssets.map((asset) => ({
    params: { file: asset.filename }, props: { body: asset.svg, type: 'image/svg+xml; charset=utf-8' },
  })),
  { params: { file: 'README.md' }, props: { body: iconUsageReadme, type: 'text/markdown; charset=utf-8' } },
  { params: { file: 'atomsai-icon-usage.zip' }, props: { type: 'application/zip' } },
];

export const GET: APIRoute = ({ props, params }) => {
  const body = props.type === 'application/zip'
    ? new Uint8Array(zipSync(Object.fromEntries(Object.entries(iconUsageFiles()).map(([name, content]) => [name, strToU8(content)]))))
    : props.body;
  return new Response(body, { headers: {
    'Content-Type': props.type,
    'Content-Disposition': `attachment; filename="${params.file}"`,
  } });
};
