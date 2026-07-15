import { emptyReactionSummary, reactionKinds } from "@lunacea/core/reactions.ts";
import type { ReactionKind, ReactionSummary } from "@lunacea/schemas";
import type { ReactionRepository } from "./repository.ts";

type KvProvider = () => Promise<Deno.Kv>;

export function createDenoKvReactionRepository(
  getKv: KvProvider = () => Deno.openKv(),
  limit = 30,
  windowMs = 10 * 60_000,
): ReactionRepository {
  const actorKey = (
    contentId: string,
    actorId: string,
    kind: ReactionKind,
  ): Deno.KvKey => ["reaction", "actor", contentId, actorId, kind];
  const countKey = (
    contentId: string,
    kind: ReactionKind,
  ): Deno.KvKey => ["reaction", "count", contentId, kind];

  async function get(contentId: string, actorId: string): Promise<ReactionSummary> {
    const kv = await getKv();
    const actorEntries = await kv.getMany(
      reactionKinds.map((kind) => actorKey(contentId, actorId, kind)),
    );
    const countEntries = await kv.getMany(
      reactionKinds.map((kind) => countKey(contentId, kind)),
    );
    const result = emptyReactionSummary(contentId);
    reactionKinds.forEach((kind, index) => {
      if (actorEntries[index].value === true) result.selected.push(kind);
      const count = countEntries[index].value;
      result.counts[kind] = typeof count === "number" ? count : 0;
    });
    return result;
  }

  return {
    get,
    async set(contentId, actorId, kind, active) {
      const kv = await getKv();
      for (let attempt = 0; attempt < 5; attempt += 1) {
        const selected = await kv.get<boolean>(actorKey(contentId, actorId, kind));
        const count = await kv.get<number>(countKey(contentId, kind));
        if (Boolean(selected.value) === active) return await get(contentId, actorId);
        const nextCount = Math.max(0, (count.value ?? 0) + (active ? 1 : -1));
        const atomic = kv.atomic()
          .check(selected)
          .check(count)
          .set(countKey(contentId, kind), nextCount);
        if (active) atomic.set(actorKey(contentId, actorId, kind), true);
        else atomic.delete(actorKey(contentId, actorId, kind));
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
