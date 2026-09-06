# Content model

Status: Accepted

Public content is Git-managed `.svx` under `packages/content/entries`. The Zod schemas in
`packages/schemas/src/content.ts` are the executable source of truth; this document records their
stable public meaning and migration rules.

## Stable identity and aliases

Canonical identity is `type:slug`, and the directory name must match `slug`. Slugs and canonical IDs
are public identifiers. `legacyIds` and `legacyPaths` preserve deliberately migrated IDs and URLs;
aliases must be globally unique and must never point to more than one entry.

Talks are Articles with `category: talk`. Migrated Talks use `article:slug` canonically and retain
`talk:slug` plus `/talks/slug` as data aliases for feed identity; deleted `/talks` public routes are
not served. Their RSS GUID and Atom ID remain the old absolute Talk URL. Reactions use the canonical
content ID and do not migrate the retired multi-kind reaction state.

## Types

- Article: engineering, research, design, essay, log, or talk. Talk articles require event data.
- Work: image-led project record with period, role, fields, technology stack, links, and an `.svx`
  case study. `stack` remains the canonical technology field; `fields` owns broader practice areas.
- Diary, Photo, Place, Wine, Moment: Archive records with type-specific optional metadata.

Talk event data contains name, held date, in-person/online/hybrid mode, optional venue, presentation
type, and optional slide/event URLs. A venue is required for in-person and hybrid events.

## Representative media

Article and Archive covers are optional authored images. Work cover state is required and is one of
an authored image, an explicitly supplied local OGP image, or a structural placeholder. A
placeholder is not final artwork and remains machine-readable without failing validation.

Authored images use local paths, meaningful alt text, intrinsic width and height, and an optional
caption. Remote image hotlinks are rejected. Missing Article imagery produces typography-led UI; it
never triggers generated decorative artwork.

## Validation

Build validation checks frontmatter, stable and legacy ID uniqueness, slug/directory agreement,
related IDs, internal links, local cover assets, remote image hotlinks, and a Git-managed preview
cache entry for every external `LinkCard` URL. It does not perform network requests or weaken
schemas to accommodate invalid content. Preview metadata is refreshed only through
`deno task links:refresh`; generated metadata JSON and local WebP assets are reviewed and committed
with the content that references them.

## Technical-blog publication (2026-09)

Only the seven existing Article entries are published. Works and Archive `.svx` entries and their
routes have been removed; old catalog, detail, and OGP URLs return 404 without redirects. Article
slugs, IDs, and Talk feed aliases remain stable. The existing public type schemas and reaction
storage contract remain available; this publication change does not migrate or delete KV data.

Composition is generated from source-ordered text, technical, and media blocks, with normalized
positions, units, heading IDs, and prose character counts. Source metadata, scripts, fenced code,
image URLs and markup are excluded from prose counts. Paper layers are
`min(5, max(1, ceil(estimatedMinutes)))`: one sheet per reading minute, a time cue rather than
printed pages. The registry carries no duplicated prose text and remains a build-time artifact.
