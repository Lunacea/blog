import { Hono } from "hono";
import { z } from "zod";
import {
  locationSchema,
  reactionKindSchema,
  reactionRequestSchema,
  reactionTargetSchema,
} from "@lunacea/schemas";
import { signedActor } from "./cookie.ts";
import { createDenoKvReactionRepository } from "./reactions/deno_kv_repository.ts";
import type { ReactionRepository } from "./reactions/repository.ts";
import { defaultLocation, findLocations, getWeather } from "./weather/service.ts";

export type ApiOptions = {
  reactions?: ReactionRepository;
  signingSecret?: string;
  fetcher?: typeof fetch;
};

type ApiEnvironment = {
  Bindings: { fetcher?: typeof fetch };
};

function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
  const expected = forwardedHost
    ? `${forwardedProto}://${forwardedHost}`
    : new URL(request.url).origin;
  return origin === expected;
}

export function createApi(options: ApiOptions = {}): Hono<ApiEnvironment> {
  const app = new Hono<ApiEnvironment>().basePath("/api/v1");
  const reactions = options.reactions ?? createDenoKvReactionRepository();
  const secret = options.signingSecret ??
    Deno.env.get("REACTION_SIGNING_SECRET") ??
    "local-development-secret-change-before-production";

  app.onError((error, context) => {
    console.error("api_error", { path: context.req.path, message: error.message });
    return context.json({ error: "internal_error" }, 500);
  });

  app.get(
    "/health",
    (context) => context.json({ ok: true, service: "lunacea", now: new Date().toISOString() }),
  );

  app.get("/locations", async (context) => {
    const query = z.string().max(80).catch("").parse(context.req.query("q"));
    return context.json({
      locations: await findLocations(query, context.env?.fetcher ?? options.fetcher),
    });
  });

  app.get("/weather", async (context) => {
    const parsed = locationSchema.safeParse({
      id: context.req.query("id") ?? "custom",
      name: context.req.query("name") ?? "選択した地点",
      region: context.req.query("region") || undefined,
      country: context.req.query("country") ?? "—",
      latitude: Number(context.req.query("lat") ?? defaultLocation.latitude),
      longitude: Number(context.req.query("lon") ?? defaultLocation.longitude),
      timezone: context.req.query("timezone") ?? defaultLocation.timezone,
    });
    if (!parsed.success) return context.json({ error: "invalid_location" }, 400);
    return context.json(
      await getWeather(parsed.data, context.env?.fetcher ?? options.fetcher),
      200,
      {
        "cache-control": "public, max-age=60, s-maxage=1200, stale-while-revalidate=300",
      },
    );
  });

  app.get("/reactions/:type/:slug", async (context) => {
    const target = reactionTargetSchema.safeParse(context.req.param());
    if (!target.success) return context.json({ error: "invalid_target" }, 400);
    const actor = await signedActor(context.req.header("cookie"), secret);
    if (actor.cookie) context.header("set-cookie", actor.cookie);
    const id = `${target.data.type}:${target.data.slug}`;
    return context.json(await reactions.get(id, actor.actorId), 200, {
      "cache-control": "private, no-store",
    });
  });

  app.put("/reactions/:type/:slug/:kind", async (context) => {
    if (!sameOrigin(context.req.raw)) return context.json({ error: "invalid_origin" }, 403);
    if (Number(context.req.header("content-length") ?? 0) > 256) {
      return context.json({ error: "payload_too_large" }, 413);
    }
    const target = reactionTargetSchema.safeParse(context.req.param());
    const kind = reactionKindSchema.safeParse(context.req.param("kind"));
    const body = reactionRequestSchema.safeParse(await context.req.json().catch(() => null));
    if (!target.success || !kind.success || !body.success) {
      return context.json({ error: "invalid_request" }, 400);
    }
    const actor = await signedActor(context.req.header("cookie"), secret);
    if (!(await reactions.consume(actor.actorId))) {
      return context.json({ error: "rate_limited" }, 429, { "retry-after": "600" });
    }
    if (actor.cookie) context.header("set-cookie", actor.cookie);
    const id = `${target.data.type}:${target.data.slug}`;
    return context.json(
      await reactions.set(id, actor.actorId, kind.data, body.data.active),
      200,
      { "cache-control": "private, no-store" },
    );
  });

  app.notFound((context) => context.json({ error: "not_found" }, 404));
  return app;
}
