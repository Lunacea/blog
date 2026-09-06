import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type LayoutElement = "div" | "section" | "article" | "main" | "nav" | "aside" | "ul" | "ol";
export type LayoutGap = "xs" | "sm" | "md" | "lg" | "xl";
export type LayoutProps = HTMLAttributes<HTMLElement> & {
  as?: LayoutElement;
  children?: Snippet;
};
