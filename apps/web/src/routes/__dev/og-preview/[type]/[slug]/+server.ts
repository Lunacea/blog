import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { allContent, findContent } from "@lunacea/content";
import type { ContentType } from "@lunacea/schemas";
import { coverOgPngResponse, ogPngResponse, renderOgSvg } from "$lib/server/og.ts";

export const prerender = false;

export async function GET({ params }) {
  if (!dev) error(404, "Not found");
  const content = findContent(params.type as ContentType, params.slug);
  if (!content) error(404, "Content not found");
  if (content.cover && content.cover.kind !== "placeholder") {
    return await coverOgPngResponse(content.cover.src, content.title, "OG PREVIEW / LUNACEA");
  }
  return await ogPngResponse(renderOgSvg({
    eyebrow: "OG PREVIEW / LUNACEA",
    title: content.title,
    compact: true,
  }));
}

export function entries() {
  return allContent.map((entry) => ({ type: entry.type, slug: entry.slug }));
}
