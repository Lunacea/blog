import { articleView, dayNumber, serendipityCount, serendipityPicks } from "$lib/article-view.ts";
import { createDenoKvImpressionRepository } from "@lunacea/api";
import { allContent, articleComposition } from "@lunacea/content";
import { searchDocuments } from "@lunacea/content/search.ts";
import { searchContent, type SearchSort } from "@lunacea/core/search.ts";
import { type Article, articleCategorySchema } from "@lunacea/schemas";
import type { PageServerLoad } from "./$types.d.ts";

export const prerender = false;

const impressions = createDenoKvImpressionRepository();

/** Ranking is an optional read: an unavailable store leaves the catalog fully usable. */
async function impressionCounts(ids: readonly string[]): Promise<Record<string, number>> {
  try {
    return await impressions.counts(ids);
  } catch {
    return {};
  }
}

const sorts = new Set<SearchSort>(["relevance", "published", "updated"]);

export const load: PageServerLoad = async ({ url, setHeaders }) => {
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
  const view = articleView(url.searchParams);
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
    composition: articleComposition(entry.slug),
  }));
  const isFiltered = Boolean(query || filters.category || filters.tag || sort !== "published");
  // The front section keeps its chronology; the daily box draws only from what follows it.
  const pool = entries.slice(2);
  const serendipity = isFiltered
    ? []
    : serendipityPicks(pool, serendipityCount(pool.length), dayNumber(new Date())).map((entry) =>
      entry.slug
    );
  const counts = await impressionCounts(entries.map((entry) => `article:${entry.slug}`));
  const ranking = entries
    .map((entry) => ({ slug: entry.slug, impressions: counts[`article:${entry.slug}`] ?? 0 }))
    .sort((left, right) =>
      right.impressions - left.impressions || left.slug.localeCompare(right.slug)
    )
    .slice(0, 5);
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
    serendipity,
    ranking,
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
    isFiltered,
  };
};
