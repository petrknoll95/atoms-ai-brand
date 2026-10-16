import type { APIRoute } from 'astro';
import { logoArchive } from '../../data/logoArchives';

export const GET: APIRoute = () => new Response(logoArchive(), {
  headers: { 'Content-Type': 'application/zip' },
});
