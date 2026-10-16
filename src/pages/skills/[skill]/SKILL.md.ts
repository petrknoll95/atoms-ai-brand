import type { APIRoute, GetStaticPaths } from 'astro';
import { skills } from '../../../data/skills';

export const getStaticPaths: GetStaticPaths = () => skills.map((skill) => ({
  params: { skill: skill.slug }, props: { markdown: skill.markdown },
}));

export const GET: APIRoute = ({ props }) => new Response(props.markdown, {
  headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
});
