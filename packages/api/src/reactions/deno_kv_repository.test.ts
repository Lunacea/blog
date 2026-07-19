import { assertEquals } from "@std/assert";
import { createDenoKvReactionRepository } from "./deno_kv_repository.ts";

Deno.test("Deno KV repository persists selections, totals, and rate limits", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const repository = createDenoKvReactionRepository(() => Promise.resolve(kv), 1);
    const active = await repository.set("article:test", "actor", true);
    assertEquals(active.count, 1);
    assertEquals(active.selected, true);
    assertEquals((await repository.set("article:test", "actor", true)).count, 1);
    assertEquals(await repository.consume("actor"), true);
    assertEquals(await repository.consume("actor"), false);
  } finally {
    kv.close();
  }
});
