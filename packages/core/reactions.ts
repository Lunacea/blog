import type { ReactionSummary } from "@lunacea/schemas";

export function emptyReactionSummary(contentId: string): ReactionSummary {
  return {
    contentId,
    count: 0,
    selected: false,
  };
}
