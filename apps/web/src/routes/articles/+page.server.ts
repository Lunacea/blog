import { allContent } from "@lunacea/content";
import { searchDocuments } from "@lunacea/content/search.ts";
import { searchContent, type SearchSort } from "@lunacea/core/search.ts";
import { type Article, articleCategorySchema } from "@lunacea/schemas";

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
  const documents = searchDocuments.filter((entry) => entry.type === "article");
  const availableTags = new Set(documents.flatMap((entry) => entry.tags));
  const requestedTag = url.searchParams.get("tag")?.trim();
  const tag = requestedTag && availableTags.has(requestedTag) ? requestedTag : undefined;
  const view: "grid" | "list" = url.searchParams.get("view") === "grid" ? "grid" : "list";
  const filters = {
    category: categoryResult.success ? categoryResult.data : undefined,
    tag,
  };
  const entries = searchContent(documents, query, filters, sort).map((entry) => ({
    ...entry,
    cover:
      (allContent.find((content) => content.type === "article" && content.slug === entry.slug) as
        | Article
        | undefined)?.cover,
  }));
  const categories = [
    ...new Set(documents.flatMap((entry) => entry.category ? [entry.category] : [])),
  ]
    .sort();
  const tags = [...new Set(documents.flatMap((entry) => entry.tags))].sort();

  return {
    query,
    filters,
    sort,
    view,
    entries,
    facets: {
      categories,
      tags,
      categoryCounts: Object.fromEntries(
        categories.map((category) => [
          category,
          documents.filter((entry) => entry.category === category).length,
        ]),
      ),
      tagCounts: Object.fromEntries(
        tags.map((candidate) => [
          candidate,
          documents.filter((entry) => entry.tags.includes(candidate)).length,
        ]),
      ),
    },
    isFiltered: Boolean(query || filters.category || filters.tag || sort !== "published"),
  };
}
