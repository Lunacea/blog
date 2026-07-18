import previews from "./link-previews.json" with { type: "json" };

export type CachedLinkPreview = {
  href: string;
  site: string;
  title: string;
  description: string;
  image?: string;
};

export const linkPreviews = previews as Readonly<Record<string, CachedLinkPreview>>;
