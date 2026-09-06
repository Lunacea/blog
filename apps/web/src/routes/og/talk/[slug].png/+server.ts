import { error, redirect } from "@sveltejs/kit";
import { findContentById } from "@lunacea/content";

export const prerender = false;

export function GET({ params }) {
  const migrated = findContentById(`talk:${params.slug}`);
  if (!migrated) error(404, "Content not found");
  redirect(308, `/og/article/${migrated.slug}.png`);
}
