import { assertEquals } from "@std/assert";
import { createMemoryImpressionRepository } from "./memory_repository.ts";

Deno.test("an actor counts once per article inside the window and again after it", async () => {
  const repository = createMemoryImpressionRepository(1_000);
  const start = new Date("2026-09-05T00:00:00.000Z");

  assertEquals(await repository.record("article:a", "actor-1", start), 1);
  assertEquals(await repository.record("article:a", "actor-1", start), 1);
  assertEquals(await repository.record("article:a", "actor-2", start), 2);
  assertEquals(
    await repository.record("article:a", "actor-1", new Date(start.getTime() + 1_500)),
    3,
  );
  assertEquals(await repository.record("article:b", "actor-1", start), 1);
});

Deno.test("counts answer for every requested article, including unseen ones", async () => {
  const repository = createMemoryImpressionRepository();
  await repository.record("article:a", "actor-1");

  assertEquals(await repository.counts(["article:a", "article:missing"]), {
    "article:a": 1,
    "article:missing": 0,
  });
  assertEquals(await repository.counts([]), {});
});
