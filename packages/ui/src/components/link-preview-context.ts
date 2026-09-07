import { getContext, setContext } from "svelte";

export type LinkPreview = {
  href: string;
  site: string;
  title: string;
  description: string;
  image?: string;
};

export type LinkPreviewRegistry = Readonly<Record<string, LinkPreview>>;
type LinkPreviewRegistryAccessor = () => LinkPreviewRegistry;

const linkPreviewContext = Symbol("lunacea-link-preview-registry");

export function provideLinkPreviews(registry: LinkPreviewRegistryAccessor): void {
  setContext(linkPreviewContext, registry);
}

export function useLinkPreviews(): LinkPreviewRegistryAccessor | undefined {
  return getContext<LinkPreviewRegistryAccessor | undefined>(linkPreviewContext);
}
