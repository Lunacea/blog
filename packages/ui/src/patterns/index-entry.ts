/** ホームと記事一覧が共有する番号付き索引の1行。 */
export type IndexEntry = {
  slug: string;
  href: string;
  title: string;
  summary?: string;
  category?: string;
  publishedAt: string;
  tags?: readonly string[];
};
