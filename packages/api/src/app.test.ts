import { assert, assertEquals } from "@std/assert";
import { createApi } from "./app.ts";
import { createMemoryImpressionRepository } from "./impressions/memory_repository.ts";
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

  const denied = await app.request("http://localhost/api/v1/reactions/article/test", {
    method: "PUT",
    headers: { origin: "https://invalid.example", "content-type": "application/json" },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(denied.status, 403);

  const accepted = await app.request("http://localhost/api/v1/reactions/article/test", {
    method: "PUT",
    headers: {
      origin: "http://localhost",
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(accepted.status, 200);
  assertEquals((await accepted.json()).count, 1);

  const limited = await app.request("http://localhost/api/v1/reactions/article/test", {
    method: "PUT",
    headers: {
      origin: "http://localhost",
      cookie,
      "content-type": "application/json",
    },
    body: JSON.stringify({ active: true }),
  });
  assertEquals(limited.status, 429);

  const retiredKindRoute = await app.request(
    "http://localhost/api/v1/reactions/article/test/useful",
    {
      method: "PUT",
      headers: {
        origin: "http://localhost",
        cookie,
        "content-type": "application/json",
      },
      body: JSON.stringify({ active: true }),
    },
  );
  assertEquals(retiredKindRoute.status, 404);
});

Deno.test("impressions accept same-origin posts and stay anonymous", async () => {
  const impressions = createMemoryImpressionRepository();
  const app = createApi({
    reactions: createMemoryReactionRepository(1),
    impressions,
    signingSecret: "test-secret",
  });

  const denied = await app.request("http://localhost/api/v1/impressions/article/test", {
    method: "POST",
    headers: { origin: "https://invalid.example" },
  });
  assertEquals(denied.status, 403);

  const first = await app.request("http://localhost/api/v1/impressions/article/test", {
    method: "POST",
    headers: { origin: "http://localhost" },
  });
  assertEquals(first.status, 200);
  const cookie = first.headers.get("set-cookie")?.split(";")[0];
  assert(cookie);
  assertEquals(await first.json(), { contentId: "article:test", impressions: 1 });

  const repeated = await app.request("http://localhost/api/v1/impressions/article/test", {
    method: "POST",
    headers: { origin: "http://localhost", cookie },
  });
  assertEquals((await repeated.json()).impressions, 1);

  const invalid = await app.request("http://localhost/api/v1/impressions/article/Not_A_Slug", {
    method: "POST",
    headers: { origin: "http://localhost", cookie },
  });
  assertEquals(invalid.status, 400);

  assertEquals(await impressions.counts(["article:test"]), { "article:test": 1 });
});
