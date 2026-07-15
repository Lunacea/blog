import { z } from "zod";
import { contentTypeSchema } from "./content.ts";

export const reactionKindSchema = z.enum(["useful", "inspiring", "love"]);
export type ReactionKind = z.infer<typeof reactionKindSchema>;

export const reactionCountsSchema = z.record(reactionKindSchema, z.number().int().nonnegative());
export const reactionSummarySchema = z.object({
  contentId: z.string(),
  counts: reactionCountsSchema,
  selected: z.array(reactionKindSchema),
});

export const reactionRequestSchema = z.object({
  active: z.boolean(),
});

export const reactionTargetSchema = z.object({
  type: contentTypeSchema,
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  kind: reactionKindSchema.optional(),
});

export const locationSchema = z.object({
  id: z.string(),
  name: z.string(),
  region: z.string().optional(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  timezone: z.string(),
});

export const weatherConditionSchema = z.enum([
  "clear",
  "cloudy",
  "fog",
  "rain",
  "snow",
  "storm",
  "unknown",
]);
export const dayPhaseSchema = z.enum(["day", "night"]);
export const weatherStateSchema = z.object({
  location: locationSchema,
  observedAt: z.string(),
  temperatureC: z.number().nullable(),
  condition: weatherConditionSchema,
  phase: dayPhaseSchema,
  source: z.enum(["open-meteo", "time-fallback"]),
});

export type ReactionSummary = z.infer<typeof reactionSummarySchema>;
export type Location = z.infer<typeof locationSchema>;
export type WeatherCondition = z.infer<typeof weatherConditionSchema>;
export type WeatherState = z.infer<typeof weatherStateSchema>;
