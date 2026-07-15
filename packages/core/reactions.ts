import type { ReactionKind, ReactionSummary } from "@lunacea/schemas";

export const reactionKinds: ReactionKind[] = ["useful", "inspiring", "love"];

export function emptyReactionSummary(contentId: string): ReactionSummary {
  return {
    contentId,
    counts: { useful: 0, inspiring: 0, love: 0 },
    selected: [],
  };
}

export function toggleReaction(
  summary: ReactionSummary,
  kind: ReactionKind,
  active: boolean,
): ReactionSummary {
  const selected = new Set(summary.selected);
  const wasActive = selected.has(kind);
  if (active) selected.add(kind);
  else selected.delete(kind);
  const delta = Number(active) - Number(wasActive);
  return {
    ...summary,
    selected: reactionKinds.filter((candidate) => selected.has(candidate)),
    counts: {
      ...summary.counts,
      [kind]: Math.max(0, summary.counts[kind] + delta),
    },
  };
}
