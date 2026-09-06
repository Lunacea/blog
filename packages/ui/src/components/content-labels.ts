import type { ContentStatus } from "@lunacea/schemas";

const statusLabels: Record<ContentStatus, string> = {
  stable: "公開済み",
  growing: "更新中",
  fragment: "断片",
  deprecated: "旧版",
};

export function contentStatusLabel(status: ContentStatus): string {
  return statusLabels[status];
}
