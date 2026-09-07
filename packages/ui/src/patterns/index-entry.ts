/** One row of the shared numbered index used by Home and the article catalog. */
export type IndexEntry = {
  slug: string;
  href: string;
  title: string;
  summary?: string;
  category?: string;
  publishedAt: string;
  tags?: readonly string[];
};
