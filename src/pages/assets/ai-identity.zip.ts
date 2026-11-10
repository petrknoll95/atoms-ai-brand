import type { APIRoute } from 'astro';
import { signalArchive } from '../../data/aiIdentityDownloads';
export const GET: APIRoute = () => new Response(signalArchive(), { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': 'attachment; filename="atomsai-ai-identity.zip"' } });
