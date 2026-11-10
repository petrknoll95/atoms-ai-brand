import type { APIRoute, GetStaticPaths } from 'astro';
import { skills, type SkillResource } from '../../../data/skills';

export const getStaticPaths: GetStaticPaths = () => skills.flatMap((skill) => skill.resources
  .filter((resource) => resource.path !== 'SKILL.md')
  .map((resource) => ({ params: { skill: skill.slug, resource: resource.path }, props: { resource } })));

// Only statically enumerated package files are served; request paths are never read from disk.
export const GET: APIRoute = ({ props }) => {
  const resource = props.resource as SkillResource;
  return new Response(resource.data, {
    headers: { 'Content-Type': resource.contentType, 'X-Content-Type-Options': 'nosniff' },
  });
};
