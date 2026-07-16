/// <reference types="vite/client" />

import type { Component } from "svelte";
import { type Content, contentSchema, type ContentType } from "@lunacea/schemas";
import { metadataModules } from "./.generated/metadata.ts";

export type ContentModule = {
  default: Component;
  metadata: unknown;
  headings: Array<{ id: string; text: string; level: number }>;
};

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

export function findContentById(id: string): Content | undefined {
  return allContent.find((entry) =>
    `${entry.type}:${entry.slug}` === id || entry.legacyIds.includes(id)
  );
}

export function findContentByPath(path: string): Content | undefined {
  return allContent.find((entry) =>
    hrefForContent(entry) === path || entry.legacyPaths.includes(path)
  );
}

export function canonicalContentId(id: string): string | undefined {
  const content = findContentById(id);
  return content ? `${content.type}:${content.slug}` : undefined;
}

/**
 * A migrated target keeps writing to its pre-migration KV key. This is injected
 * into the API boundary; no KV records or anonymous actor IDs are copied.
 */
export function resolveReactionTarget(id: string): string {
  const content = findContentById(id);
  return content?.legacyIds.find((legacyId) => legacyId.startsWith("talk:")) ?? id;
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
  return `/archive/${content.type}s/${content.slug}`;
}

export const tags = [...new Set(allContent.flatMap((entry) => entry.tags))]
  .sort((left, right) => left.localeCompare(right, "ja"));
