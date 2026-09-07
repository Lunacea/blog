import { assert, assertEquals } from "@std/assert";
import { signedActor } from "./cookie.ts";

Deno.test("anonymous actor cookie is signed and reusable", async () => {
  const created = await signedActor(undefined, "test-secret");
  assert(created.cookie?.includes("HttpOnly"));
  assert(created.cookie?.includes("SameSite=Lax"));
  const cookie = created.cookie?.split(";")[0];
  const reused = await signedActor(cookie, "test-secret");
  assertEquals(reused.actorId, created.actorId);
  assertEquals(reused.cookie, undefined);
});

Deno.test("tampered actor cookie is replaced", async () => {
  const actor = await signedActor("lunacea_actor=attacker.invalid", "test-secret");
  assert(actor.actorId !== "attacker");
  assert(actor.cookie);
});
