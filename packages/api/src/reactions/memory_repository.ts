import { emptyReactionSummary, reactionKinds } from "@lunacea/core/reactions.ts";
import type { ReactionKind, ReactionSummary } from "@lunacea/schemas";
import type { ReactionRepository } from "./repository.ts";

export function createMemoryReactionRepository(
  limit = 30,
  windowMs = 10 * 60_000,
): ReactionRepository {
  const selections = new Map<string, Set<ReactionKind>>();
  const rateLimits = new Map<string, { count: number; expiresAt: number }>();

  function actorKey(contentId: string, actorId: string): string {
    return `${contentId}:${actorId}`;
  }

  function summary(contentId: string, actorId: string): ReactionSummary {
    const result = emptyReactionSummary(contentId);
    result.selected = reactionKinds.filter((kind) =>
      selections.get(actorKey(contentId, actorId))?.has(kind)
    );
    for (const [key, selected] of selections) {
      if (!key.startsWith(`${contentId}:`)) continue;
      for (const kind of selected) result.counts[kind] += 1;
    }
    return result;
  }

  return {
    get(contentId, actorId) {
      return Promise.resolve(summary(contentId, actorId));
    },
    set(contentId, actorId, kind, active) {
      const key = actorKey(contentId, actorId);
      const selected = selections.get(key) ?? new Set<ReactionKind>();
      if (active) selected.add(kind);
      else selected.delete(kind);
      selections.set(key, selected);
      return Promise.resolve(summary(contentId, actorId));
    },
    consume(actorId, now = new Date()) {
      const current = rateLimits.get(actorId);
      if (!current || current.expiresAt <= now.getTime()) {
        rateLimits.set(actorId, { count: 1, expiresAt: now.getTime() + windowMs });
        return Promise.resolve(true);
      }
      if (current.count >= limit) return Promise.resolve(false);
      current.count += 1;
      return Promise.resolve(true);
    },
  };
}
