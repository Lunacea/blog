import type { ImpressionRepository } from "./repository.ts";

export function createMemoryImpressionRepository(
  windowMs = 12 * 60 * 60_000,
): ImpressionRepository {
  const counts = new Map<string, number>();
  const seen = new Map<string, number>();

  return {
    record(contentId, actorId, now = new Date()) {
      const key = `${contentId} ${actorId}`;
      const previous = seen.get(key);
      const current = counts.get(contentId) ?? 0;
      if (previous !== undefined && now.getTime() - previous < windowMs) {
        return Promise.resolve(current);
      }
      seen.set(key, now.getTime());
      const next = current + 1;
      counts.set(contentId, next);
      return Promise.resolve(next);
    },
    counts(contentIds) {
      return Promise.resolve(
        Object.fromEntries(contentIds.map((id) => [id, counts.get(id) ?? 0])),
      );
    },
  };
}
