import type { ReactionSummary } from "@lunacea/schemas";

export function emptyReactionSummary(contentId: string): ReactionSummary {
  return {
    contentId,
    count: 0,
    selected: false,
  };
}

export function toggleReaction(
  summary: ReactionSummary,
  active: boolean,
): ReactionSummary {
  const delta = Number(active) - Number(summary.selected);
  return {
    ...summary,
    selected: active,
    count: Math.max(0, summary.count + delta),
  };
}
