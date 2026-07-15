import { assertEquals } from "@std/assert";
import { createMemoryReactionRepository } from "./memory_repository.ts";

Deno.test("memory repository toggles once per actor and aggregates counts", async () => {
  const repository = createMemoryReactionRepository();
  await repository.set("article:test", "actor-a", "love", true);
  await repository.set("article:test", "actor-a", "love", true);
  await repository.set("article:test", "actor-b", "love", true);
  assertEquals((await repository.get("article:test", "actor-a")).counts.love, 2);
  assertEquals((await repository.get("article:test", "actor-a")).selected, ["love"]);

  await repository.set("article:test", "actor-a", "love", false);
  assertEquals((await repository.get("article:test", "actor-a")).counts.love, 1);
});

Deno.test("memory rate limit resets after its window", async () => {
  const repository = createMemoryReactionRepository(2, 1_000);
  const start = new Date("2026-01-01T00:00:00Z");
  assertEquals(await repository.consume("actor", start), true);
  assertEquals(await repository.consume("actor", start), true);
  assertEquals(await repository.consume("actor", start), false);
  assertEquals(await repository.consume("actor", new Date(start.getTime() + 1_001)), true);
});
