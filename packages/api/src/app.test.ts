import { assert, assertEquals } from "@std/assert";
import { createApi } from "./app.ts";
import { createMemoryReactionRepository } from "./reactions/memory_repository.ts";

Deno.test("API exposes health and validates reaction origin", async () => {
  const app = createApi({
    reactions: createMemoryReactionRepository(1),
    signingSecret: "test-secret",
  });
  const health = await app.request("http://localhost/api/v1/health");
  assertEquals(health.status, 200);
  assertEquals((await health.json()).service, "lunacea");

  const get = await app.request("http://localhost/api/v1/reactions/article/test");
  const cookie = get.headers.get("set-cookie")?.split(";")[0];
  assert(cookie);

  const denied = await app.request("http://localhost/api/v1/reactions/article/test/useful", {
    method: "PUT",
    headers: { origin: "https://invalid.example", "content-type": "application/json" },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(denied.status, 403);

  const accepted = await app.request("http://localhost/api/v1/reactions/article/test/useful", {
    method: "PUT",
    headers: {
      origin: "http://localhost",
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(accepted.status, 200);
  assertEquals((await accepted.json()).counts.useful, 1);

  const limited = await app.request("http://localhost/api/v1/reactions/article/test/love", {
    method: "PUT",
    headers: {
      origin: "http://localhost",
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(limited.status, 429);
});

Deno.test("reaction API resolves migrated storage targets", async () => {
  const reactions = createMemoryReactionRepository(3);
  const app = createApi({
    reactions,
    signingSecret: "test-secret",
    resolveReactionTarget: (id) => id === "article:quiet-interfaces" ? "talk:quiet-interfaces" : id,
  });

  const response = await app.request(
    "http://localhost/api/v1/reactions/article/quiet-interfaces/useful",
    {
      method: "PUT",
      headers: {
        origin: "http://localhost",
        "content-type": "application/json",
      },
      body: JSON.stringify({ active: true }),
    },
  );

  assertEquals(response.status, 200);
  const stored = await reactions.get("talk:quiet-interfaces", "different-actor");
  assertEquals(stored.counts.useful, 1);
});
