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
`talk:slug` plus `/talks/slug` as aliases. Their RSS GUID and Atom ID remain the old absolute Talk
URL. Their anonymous-reaction storage target also remains the legacy ID so no KV actor state is
copied.

## Types

- Article: engineering, research, design, essay, log, or talk. Talk articles require event data.
- Work: image-led project record with period, role, stack, links, and an `.svx` case study.
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
related IDs, internal links, local cover assets, and remote image hotlinks. It does not perform
network requests or weaken schemas to accommodate invalid content.
