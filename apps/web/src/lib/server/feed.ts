import { allContent, hrefForContent } from "@lunacea/content";
import { siteConfig } from "@lunacea/config";

export const publishedFeedContent = allContent.filter((entry) => !entry.sample && !entry.draft);

export function xml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function absoluteHref(content: (typeof allContent)[number]): string {
  return siteConfig.url + hrefForContent(content);
}
