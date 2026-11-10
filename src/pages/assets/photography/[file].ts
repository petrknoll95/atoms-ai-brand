import type { APIRoute, GetStaticPaths } from 'astro';
import { photographyAssets } from '../../../data/photography';

export const getStaticPaths: GetStaticPaths = () => photographyAssets().map(asset => ({ params: { file: asset.file } }));

export const GET: APIRoute = ({ params }) => {
  const asset = photographyAssets().find(asset => asset.file === params.file)!;
  return new Response(asset.content, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
};
