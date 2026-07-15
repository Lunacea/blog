import { assertEquals } from "@std/assert";
import { createDenoKvReactionRepository } from "./deno_kv_repository.ts";

Deno.test("Deno KV repository persists selections, totals, and rate limits", async () => {
  const kv = await Deno.openKv(":memory:");
  try {
    const repository = createDenoKvReactionRepository(() => Promise.resolve(kv), 1);
    const active = await repository.set("article:test", "actor", "useful", true);
    assertEquals(active.counts.useful, 1);
    assertEquals(active.selected, ["useful"]);
    assertEquals((await repository.set("article:test", "actor", "useful", true)).counts.useful, 1);
    assertEquals(await repository.consume("actor"), true);
    assertEquals(await repository.consume("actor"), false);
  } finally {
    kv.close();
  }
});
