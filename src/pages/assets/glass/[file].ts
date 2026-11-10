import type { APIRoute, GetStaticPaths } from 'astro';
import { zipSync, strToU8 } from 'fflate';
import { glassFiles } from '../../../data/glass';
const mime: Record<string, string> = { css: 'text/css', json: 'application/json', html: 'text/html', md: 'text/markdown' };
export const getStaticPaths: GetStaticPaths = () => [
  ...Object.entries(glassFiles()).map(([file, body]) => ({ params: { file }, props: { body } })),
  { params: { file: 'atomsai-glass.zip' } },
];
export const GET: APIRoute = ({ props, params }) => {
  const file = params.file!;
  const zip = file === 'atomsai-glass.zip';
  const body = zip ? new Uint8Array(zipSync(Object.fromEntries(Object.entries(glassFiles()).map(([name, text]) => [name, strToU8(text)])))) : props.body;
  return new Response(body, { headers: {
    'Content-Type': zip ? 'application/zip' : `${mime[file.split('.').pop()!]}; charset=utf-8`,
    'Content-Disposition': `attachment; filename="${file}"`,
  } });
};
