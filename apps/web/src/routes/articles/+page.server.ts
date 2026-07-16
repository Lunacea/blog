import { searchDocuments } from "@lunacea/content/search.ts";
import { searchContent, type SearchSort } from "@lunacea/core/search.ts";
import { articleCategorySchema } from "@lunacea/schemas";

export const prerender = false;

const sorts = new Set<SearchSort>(["relevance", "published", "updated"]);

export function load({ url, setHeaders }) {
  setHeaders({
    "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
  });

  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const categoryResult = articleCategorySchema.safeParse(url.searchParams.get("category"));
  const requestedSort = url.searchParams.get("sort") as SearchSort | null;
  const sort = requestedSort && sorts.has(requestedSort)
    ? requestedSort
    : query
    ? "relevance"
    : "published";
  const tag = url.searchParams.get("tag")?.trim() || undefined;
  const filters = {
    category: categoryResult.success ? categoryResult.data : undefined,
    tag,
  };
  const documents = searchDocuments.filter((entry) => entry.type === "article");

  return {
    query,
    filters,
    sort,
    entries: searchContent(documents, query, filters, sort),
    isFiltered: [...url.searchParams.keys()].length > 0,
  };
}
