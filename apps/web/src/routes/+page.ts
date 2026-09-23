import { hrefForContent, listContent } from "@lunacea/content";

export const prerender = true;

export function load() {
  const articles = listContent("article");
  return {
    latest: articles.slice(0, 6).map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary,
      category: article.category,
      publishedAt: article.publishedAt,
      href: hrefForContent(article),
      tags: article.tags,
    })),
    categories: [...new Set(articles.map((article) => article.category))].sort(),
    total: articles.length,
  };
}
