import type { APIRoute } from 'astro';
import { tokensCss } from '../data/colors';

export const GET: APIRoute = () =>
  new Response(tokensCss(), { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
