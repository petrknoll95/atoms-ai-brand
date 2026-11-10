import type { APIRoute } from 'astro';
import { zipSync } from 'fflate';
import { skills } from '../../data/skills';

export const GET: APIRoute = () => new Response(zipSync(Object.fromEntries(
  skills.flatMap((skill) => skill.resources.map((resource) => [`${skill.slug}/${resource.path}`, resource.data])),
)), { headers: { 'Content-Type': 'application/zip' } });
