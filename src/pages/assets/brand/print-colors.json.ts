import type { APIRoute } from 'astro';
import { printMatches, printReference } from '../../../data/printColors';

export const GET: APIRoute = () => new Response(JSON.stringify({
  schemaVersion: 1,
  ...printReference,
  matches: printMatches,
}, null, 2) + '\n', { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
