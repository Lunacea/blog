import type { ContentStatus } from "@lunacea/schemas";

const statusLabels: Record<ContentStatus, string> = {
  stable: "公開済み",
  growing: "更新中",
  fragment: "断片",
  deprecated: "旧版",
};

/** AIが書いた記事は、執筆の状態より先にそのことを示す。 */
export const aiWrittenLabel = "AI執筆";

export function contentStatusLabel(status: ContentStatus): string {
  return statusLabels[status];
}
