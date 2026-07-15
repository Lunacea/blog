import { allContent, tags } from "@lunacea/content";
import { searchDocuments } from "@lunacea/content/search.ts";
import { searchContent } from "@lunacea/core/search.ts";
import { contentStatusSchema, contentTypeSchema } from "@lunacea/schemas";

export const prerender = false;

export function load({ url }) {
  const query = (url.searchParams.get("q") ?? "").slice(0, 120);
  const parsedType = contentTypeSchema.safeParse(url.searchParams.get("type"));
  const parsedStatus = contentStatusSchema.safeParse(url.searchParams.get("status"));
  const yearValue = Number(url.searchParams.get("year"));
  const filters = {
    type: parsedType.success ? parsedType.data : undefined,
    tag: url.searchParams.get("tag") || undefined,
    year: Number.isInteger(yearValue) && yearValue > 1900 ? yearValue : undefined,
    status: parsedStatus.success ? parsedStatus.data : undefined,
  };
  const results = searchContent(searchDocuments, query, filters);
  return {
    query,
    filters,
    results,
    tags,
    years: [...new Set(allContent.map((entry) => Number(entry.publishedAt.slice(0, 4))))]
      .sort((left, right) => right - left),
  };
}
