import { emptyReactionSummary } from "@lunacea/core/reactions.ts";
import type { ReactionSummary } from "@lunacea/schemas";
import type { ReactionRepository } from "./repository.ts";

export function createMemoryReactionRepository(
  limit = 30,
  windowMs = 10 * 60_000,
): ReactionRepository {
  const selections = new Set<string>();
  const rateLimits = new Map<string, { count: number; expiresAt: number }>();

  function actorKey(contentId: string, actorId: string): string {
    return `${contentId}:${actorId}`;
  }

  function summary(contentId: string, actorId: string): ReactionSummary {
    const result = emptyReactionSummary(contentId);
    result.selected = selections.has(actorKey(contentId, actorId));
    result.count = [...selections].filter((key) => key.startsWith(`${contentId}:`)).length;
    return result;
  }

  return {
    get(contentId, actorId) {
      return Promise.resolve(summary(contentId, actorId));
    },
    set(contentId, actorId, active) {
      const key = actorKey(contentId, actorId);
      if (active) selections.add(key);
      else selections.delete(key);
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
