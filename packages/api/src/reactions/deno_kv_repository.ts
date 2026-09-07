import { emptyReactionSummary } from "@lunacea/core/reactions.ts";
import type { ReactionSummary } from "@lunacea/schemas";
import type { ReactionRepository } from "./repository.ts";

type KvProvider = () => Promise<Deno.Kv>;

export function createDenoKvReactionRepository(
  getKv: KvProvider = () => Deno.openKv(),
  limit = 30,
  windowMs = 10 * 60_000,
): ReactionRepository {
  const actorKey = (contentId: string, actorId: string): Deno.KvKey => [
    "praise",
    "actor",
    contentId,
    actorId,
  ];
  const countKey = (contentId: string): Deno.KvKey => ["praise", "count", contentId];

  async function get(contentId: string, actorId: string): Promise<ReactionSummary> {
    const kv = await getKv();
    const [selected, count] = await kv.getMany([
      actorKey(contentId, actorId),
      countKey(contentId),
    ]);
    const result = emptyReactionSummary(contentId);
    result.selected = selected.value === true;
    result.count = typeof count.value === "number" ? count.value : 0;
    return result;
  }

  return {
    get,
    async set(contentId, actorId, active) {
      const kv = await getKv();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const selected = await kv.get<boolean>(actorKey(contentId, actorId));
        const count = await kv.get<number>(countKey(contentId));
        if (Boolean(selected.value) === active) return await get(contentId, actorId);
        const nextCount = Math.max(0, (count.value ?? 0) + (active ? 1 : -1));
        const atomic = kv.atomic()
          .check(selected)
          .check(count)
          .set(countKey(contentId), nextCount);
        if (active) atomic.set(actorKey(contentId, actorId), true);
        else atomic.delete(actorKey(contentId, actorId));
        if ((await atomic.commit()).ok) return await get(contentId, actorId);
      }
      throw new Error("Could not update reaction after concurrent writes");
    },
    async consume(actorId, now = new Date()) {
      const kv = await getKv();
      const bucket = Math.floor(now.getTime() / windowMs);
      const key: Deno.KvKey = ["rate", "reaction", actorId, bucket];
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const current = await kv.get<number>(key);
        if ((current.value ?? 0) >= limit) return false;
        const result = await kv.atomic()
          .check(current)
          .set(key, (current.value ?? 0) + 1, { expireIn: windowMs * 2 })
          .commit();
        if (result.ok) return true;
      }
      return false;
    },
  };
}
