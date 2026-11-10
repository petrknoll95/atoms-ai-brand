import type { APIRoute, GetStaticPaths } from 'astro';
import { signalFiles } from '../../../data/aiIdentityDownloads';
export const getStaticPaths: GetStaticPaths = () => Object.entries(signalFiles()).map(([file, body]) => ({ params: { file }, props: { file, body } }));
export const GET: APIRoute = ({ props }) => {
  const { file, body } = props as { file: string; body: string };
  const mime = file.endsWith('.svg') ? 'image/svg+xml' : file.endsWith('.html') ? 'text/html' : file.endsWith('.json') ? 'application/json' : file.endsWith('.js') ? 'text/javascript' : 'text/markdown';
  return new Response(body, { headers: { 'Content-Type': `${mime}; charset=utf-8` } });
};
