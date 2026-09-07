import type { ImpressionRepository } from "./repository.ts";

type KvProvider = () => Promise<Deno.Kv>;

export function createDenoKvImpressionRepository(
  getKv: KvProvider = () => Deno.openKv(),
  windowMs = 12 * 60 * 60_000,
): ImpressionRepository {
  const countKey = (contentId: string): Deno.KvKey => ["impression", "count", contentId];
  // The actor is the existing anonymous signed cookie value, and the mark expires with the window.
  const seenKey = (contentId: string, actorId: string): Deno.KvKey => [
    "impression",
    "seen",
    contentId,
    actorId,
  ];

  return {
    async record(contentId, actorId) {
      const kv = await getKv();
      const seen = await kv.get<boolean>(seenKey(contentId, actorId));
      const current = await kv.get<number>(countKey(contentId));
      if (seen.value) return current.value ?? 0;
      const next = (current.value ?? 0) + 1;
      const result = await kv.atomic()
        .check(seen)
        .check(current)
        .set(seenKey(contentId, actorId), true, { expireIn: windowMs })
        .set(countKey(contentId), next)
        .commit();
      return result.ok ? next : current.value ?? 0;
    },
    async counts(contentIds) {
      if (!contentIds.length) return {};
      const kv = await getKv();
      const entries = await kv.getMany(contentIds.map(countKey));
      return Object.fromEntries(
        contentIds.map((id, index) => {
          const value = entries[index]?.value;
          return [id, typeof value === "number" ? value : 0];
        }),
      );
    },
  };
}
