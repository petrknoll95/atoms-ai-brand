import type { APIRoute, GetStaticPaths } from 'astro';
import { brandDownloads } from '../../../data/brandDownloads';

export const getStaticPaths: GetStaticPaths = () => brandDownloads.map((asset) => ({
  params: { asset: asset.path }, props: { svg: asset.svg },
}));

export const GET: APIRoute = ({ props }) => new Response(props.svg, {
  headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
});
