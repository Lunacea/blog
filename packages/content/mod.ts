/// <reference types="vite/client" />

import type { Component } from "svelte";
import { type Content, contentSchema, type ContentType } from "@lunacea/schemas";

export type ContentModule = {
  default: Component;
  metadata: unknown;
};

const metadataModules = import.meta.glob("./entries/**/*.svx", {
  eager: true,
  import: "metadata",
}) as Record<string, unknown>;

const contentModules = import.meta.glob("./entries/**/*.svx") as Record<
  string,
  () => Promise<ContentModule>
>;

function parseMetadata(path: string, metadata: unknown): Content {
  const result = contentSchema.safeParse(metadata);
  if (!result.success) {
    throw new Error(`Invalid content metadata in ${path}: ${result.error.message}`);
  }
  return result.data;
}

export const allContent: Content[] = Object.entries(metadataModules)
  .map(([path, metadata]) => parseMetadata(path, metadata))
  .filter((entry) => !entry.draft)
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));

export function listContent<T extends ContentType>(type: T): Extract<Content, { type: T }>[] {
  return allContent.filter((entry) => entry.type === type) as Extract<Content, { type: T }>[];
}

export function findContent(type: ContentType, slug: string): Content | undefined {
  return allContent.find((entry) => entry.type === type && entry.slug === slug);
}

export async function loadContentModule(type: ContentType, slug: string): Promise<ContentModule> {
  const key = Object.keys(contentModules).find((path) =>
    path.endsWith(`/${type}s/${slug}/index.svx`) ||
    path.endsWith(`/archive/${type}s/${slug}/index.svx`)
  );
  if (!key) throw new Error(`Content module not found: ${type}:${slug}`);
  return await contentModules[key]();
}

export function hrefForContent(content: Content): string {
  if (content.type === "article") return `/articles/${content.slug}`;
  if (content.type === "work") return `/works/${content.slug}`;
  if (content.type === "talk") return `/talks/${content.slug}`;
  return `/archive/${content.type}s/${content.slug}`;
}

export const tags = [...new Set(allContent.flatMap((entry) => entry.tags))]
  .sort((left, right) => left.localeCompare(right, "ja"));
