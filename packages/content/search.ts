/// <reference types="vite/client" />

import { allContent, hrefForContent } from "./mod.ts";
import type { SearchDocument } from "@lunacea/core/search.ts";
import { contentId } from "@lunacea/schemas";

const rawModules = import.meta.glob("./entries/**/*.svx", {
  eager: true,
  query: "?raw",
  import: "default",
}) as Record<string, string>;

function plainText(source: string): string {
  return source
    .replace(/^---[\s\S]*?---/u, "")
    .replace(/<script[\s\S]*?<\/script>/gu, "")
    .replace(/~~~[\s\S]*?~~~/gu, " ")
    .replace(/<[^>]+>/gu, " ")
    .replace(/[#>*_~\[\](){}|]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

export const searchDocuments: SearchDocument[] = allContent.map((content) => {
  const path = Object.keys(rawModules).find((candidate) =>
    candidate.includes(`/${content.slug}/index.svx`)
  );
  return {
    id: contentId(content),
    slug: content.slug,
    type: content.type,
    title: content.title,
    summary: content.summary,
    tags: content.tags,
    publishedAt: content.publishedAt,
    status: content.status,
    body: path ? plainText(rawModules[path]) : "",
    href: hrefForContent(content),
  };
});
