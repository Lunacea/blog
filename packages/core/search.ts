import type { Content } from "@lunacea/schemas";
import type { ArticleCategory } from "@lunacea/schemas";

export type SearchDocument =
  & Pick<
    Content,
    "slug" | "type" | "title" | "summary" | "tags" | "publishedAt" | "status"
  >
  & {
    id: string;
    body: string;
    href: string;
    updatedAt?: string;
    category?: ArticleCategory;
    legacyIds: string[];
  };

export type SearchFilters = {
  type?: Content["type"];
  tag?: string;
  year?: number;
  status?: Content["status"];
  category?: ArticleCategory;
};

export type SearchSort = "relevance" | "published" | "updated";

const segmenter = new Intl.Segmenter("ja", { granularity: "word" });

export function tokenize(value: string): string[] {
  const normalized = value.normalize("NFKC").toLocaleLowerCase("ja");
  const words = [...segmenter.segment(normalized)]
    .filter((segment) => segment.isWordLike)
    .map((segment) => segment.segment);
  const compact = normalized.replace(/[\s\p{P}\p{S}]+/gu, "");
  const bigrams = [...compact].flatMap((character, index, characters) =>
    index + 1 < characters.length ? [character + characters[index + 1]] : []
  );
  return [...new Set([...words, ...bigrams])];
}

function scoreField(tokens: string[], value: string, weight: number): number {
  const haystack = tokenize(value);
  return tokens.reduce((score, token) => {
    if (haystack.includes(token)) return score + weight;
    if (haystack.some((entry) => entry.startsWith(token))) return score + weight * 0.55;
    return score;
  }, 0);
}

export function searchContent(
  documents: SearchDocument[],
  query: string,
  filters: SearchFilters = {},
  sort: SearchSort = query.trim() ? "relevance" : "published",
): SearchDocument[] {
  const tokens = tokenize(query);
  return documents
    .filter((document) => !filters.type || document.type === filters.type)
    .filter((document) => !filters.tag || document.tags.includes(filters.tag))
    .filter((document) => !filters.year || document.publishedAt.startsWith(String(filters.year)))
    .filter((document) => !filters.status || document.status === filters.status)
    .filter((document) => !filters.category || document.category === filters.category)
    .map((document) => ({
      document,
      score: tokens.length === 0 ? 1 : scoreField(tokens, document.title, 8) +
        scoreField(tokens, document.tags.join(" "), 5) +
        scoreField(tokens, document.summary, 3) +
        scoreField(tokens, document.body, 1),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => {
      if (sort === "updated") {
        return (right.document.updatedAt ?? right.document.publishedAt).localeCompare(
          left.document.updatedAt ?? left.document.publishedAt,
        );
      }
      if (sort === "published") {
        return right.document.publishedAt.localeCompare(left.document.publishedAt);
      }
      return right.score - left.score ||
        right.document.publishedAt.localeCompare(left.document.publishedAt);
    })
    .map((entry) => entry.document);
}
