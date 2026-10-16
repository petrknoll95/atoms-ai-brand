import type { APIRoute } from 'astro';
import { strToU8, zipSync } from 'fflate';
import { skills } from '../../data/skills';

export const GET: APIRoute = () => new Response(zipSync(Object.fromEntries(
  skills.map((skill) => [`${skill.slug}/SKILL.md`, strToU8(skill.markdown)]),
)), { headers: { 'Content-Type': 'application/zip' } });
