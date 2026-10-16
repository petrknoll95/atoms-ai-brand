import type { APIRoute, GetStaticPaths } from 'astro';
import { logoArchive } from '../../../data/logoArchives';
import { logoVariants } from '../../../data/logoExports';

export const getStaticPaths: GetStaticPaths = () => logoVariants.map(({ id }) => ({ params: { variant: id } }));
export const GET: APIRoute = ({ params }) => new Response(logoArchive(params.variant), {
  headers: { 'Content-Type': 'application/zip' },
});
