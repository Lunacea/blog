import { z } from "zod";

export const contentStatusSchema = z.enum(["stable", "growing", "fragment", "deprecated"]);
export const contentTypeSchema = z.enum([
  "article",
  "work",
  "talk",
  "photo",
  "place",
  "wine",
  "moment",
]);
export const articleCategorySchema = z.enum(["engineering", "research", "design", "essay", "log"]);
export const archiveTypeSchema = z.enum(["photo", "place", "wine", "moment"]);

const isoDate = z.preprocess(
  (value) => {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    if (typeof value !== "string") return value;
    const leadingDate = /^\d{4}-\d{2}-\d{2}/u.exec(value)?.[0];
    if (leadingDate) return leadingDate;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toISOString().slice(0, 10);
  },
  z.iso.date(),
);
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
const nonEmpty = z.string().trim().min(1);

export const coverSchema = z.object({
  src: z.string().startsWith("/"),
  alt: nonEmpty,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const revisionSchema = z.object({
  date: isoDate,
  summary: nonEmpty,
});

export const linkSetSchema = z.object({
  github: z.url().optional(),
  demo: z.url().optional(),
  slides: z.url().optional(),
  video: z.url().optional(),
}).default({});

const baseFields = {
  slug,
  title: nonEmpty,
  summary: z.string().trim().min(24).max(240),
  publishedAt: isoDate,
  updatedAt: isoDate.optional(),
  tags: z.array(nonEmpty).max(12).default([]),
  status: contentStatusSchema.default("stable"),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  sample: z.boolean().default(true),
  cover: coverSchema.optional(),
  related: z.array(z.string()).default([]),
  revisions: z.array(revisionSchema).default([]),
};

export const articleSchema = z.object({
  ...baseFields,
  type: z.literal("article"),
  category: articleCategorySchema,
  targetVersions: z.array(nonEmpty).default([]),
  testedAt: isoDate.optional(),
  readingMinutes: z.number().positive().optional(),
});

export const workSchema = z.object({
  ...baseFields,
  type: z.literal("work"),
  period: z.coerce.string().trim().min(1),
  role: nonEmpty,
  stack: z.array(nonEmpty).min(1),
  links: linkSetSchema,
  research: z.object({
    question: nonEmpty,
    method: nonEmpty,
    contribution: nonEmpty,
  }).optional(),
});

export const talkSchema = z.object({
  ...baseFields,
  type: z.literal("talk"),
  event: nonEmpty,
  venue: nonEmpty,
  format: z.enum(["talk", "poster", "workshop", "paper"]),
  links: linkSetSchema,
});

const archiveBase = {
  ...baseFields,
  location: nonEmpty.optional(),
};

export const photoSchema = z.object({
  ...archiveBase,
  type: z.literal("photo"),
  camera: nonEmpty.optional(),
  lens: nonEmpty.optional(),
});

export const placeSchema = z.object({
  ...archiveBase,
  type: z.literal("place"),
  coordinates: z.tuple([
    z.number().min(-90).max(90),
    z.number().min(-180).max(180),
  ]).optional(),
});

export const wineSchema = z.object({
  ...archiveBase,
  type: z.literal("wine"),
  producer: nonEmpty,
  vintage: z.number().int().min(1900).max(2100).optional(),
  region: nonEmpty,
  grapes: z.array(nonEmpty).default([]),
});

export const momentSchema = z.object({
  ...archiveBase,
  type: z.literal("moment"),
});

export const contentSchema = z.discriminatedUnion("type", [
  articleSchema,
  workSchema,
  talkSchema,
  photoSchema,
  placeSchema,
  wineSchema,
  momentSchema,
]).superRefine((content, context) => {
  if (content.updatedAt && content.updatedAt < content.publishedAt) {
    context.addIssue({
      code: "custom",
      message: "updatedAt must be on or after publishedAt",
      path: ["updatedAt"],
    });
  }
});

export type ContentStatus = z.infer<typeof contentStatusSchema>;
export type ContentType = z.infer<typeof contentTypeSchema>;
export type ArticleCategory = z.infer<typeof articleCategorySchema>;
export type Content = z.infer<typeof contentSchema>;
export type Article = z.infer<typeof articleSchema>;
export type Work = z.infer<typeof workSchema>;
export type Talk = z.infer<typeof talkSchema>;
export type Photo = z.infer<typeof photoSchema>;
export type Place = z.infer<typeof placeSchema>;
export type Wine = z.infer<typeof wineSchema>;
export type Moment = z.infer<typeof momentSchema>;
export type ArchiveContent = Photo | Place | Wine | Moment;

export function contentId(content: Pick<Content, "type" | "slug">): string {
  return `${content.type}:${content.slug}`;
}
