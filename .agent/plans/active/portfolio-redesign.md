# Portfolio redesign ExecPlan

## Goal and non-goals

Rebuild the portfolio information architecture, content model, typography, reading tools, Home
composition, motion, and optional WebGL enhancement while preserving public content, progressive
enhancement, privacy, accessibility, and the existing deployment boundary. WebGL typography for the
word "Lunacea" is a separate follow-up and is not shipped by this plan.

## Architectural constraints

- SvelteKit remains the only deployment unit; Hono remains under `/api/v1`.
- `/articles` is the only content list changed to SSR so arbitrary GET search works without
  JavaScript. Works and Archive remain prerendered and expose optional client filtering.
- Article pages never import the Home Threlte/Three.js graph.
- Git-managed `.svx` remains the content source of truth. Legacy Talk IDs and paths remain aliases.
- Existing Talk reaction state continues to use its legacy KV storage key; no actor data is copied.
- Authored images are never fabricated. Missing Work imagery uses an explicit structural
  placeholder.

## Baseline

Baseline commit: `4f9325e` on `feat/post-articles`.

- content validation: 18 entries
- article initial JavaScript: 106.7 KiB gzip (150 KiB limit)
- Home WebGL dynamic dependency: 216.6 KiB gzip (230 KiB limit for this work)
- Storybook: 41 stories with axe, responsive, motion, and WebGL fallback checks
- E2E: 17 passed, 28 intentionally skipped by project matrix
- Known discovery: SVX metadata eager imports currently make the body dynamic imports ineffective

## Ordered milestones

- [x] T01 — Record the plan and accepted architecture changes.
- [x] T02 — Migrate Talk to Article aliases; add Diary, event, cover, and social contracts.
- [x] T03 — Add deterministic local font subsetting and shared Web/Storybook loading.
- [x] T04 — Merge Articles, Talks, and Search with GET SSR filtering.
- [x] T05 — Add the integrated Archive and optional kind/year/tag filtering.
- [x] T06 — Add image-led Works presentation and Work-specific filtering.
- [x] T07 — Add responsive images, cover-aware OGP, placeholders, and dev-only OGP preview.
- [x] T08 — Add build-derived headings, desktop/mobile TOC, progress, and stories.
- [x] T09 — Move weather and display controls into the Header.
- [x] T10 — Merge About and contact links into the continuous Home document.
- [x] T11–T13 — Add the Home opening, safe navigation motion, and progressive cursor.
- [x] T14–T17 — Add the spanning static visual and the three-state interactive WebGL timeline.
- [x] T18 — Record a separate WebGL typography follow-up; do not ship it here.
- [x] T19 — Complete automated accessibility and performance audits.
- [x] T20 — Complete redirect, feed identity, sitemap, OGP, and link cutover.
- [ ] T21 — Deploy a preview and finish the physical-device/manual matrix.

## Decisions

- Talk canonical IDs become `article:slug`; `talk:slug` remains a legacy alias and feed identity.
- Diary is a distinct `diary:slug` Archive type.
- Work cover placeholders are machine-readable but do not warn or fail a build.
- Article filters are query/category/manual featured tags; Work filters are status/year/stack;
  Archive filters are kind/year/tag.
- Article sort is relevance when searching, otherwise published date, with updated date available.
- Header keeps a compact weather summary visible and places location/theme/motion in one panel.
- WebGL uses Möbius strip, sphere/points, and regular octahedron. User input temporarily owns one
  timeline and automatic playback resumes after settling.

## Validation log

- `deno task content:validate`: passed; 18 content entries.
- `deno task check`: passed; 18 content entries and Svelte diagnostics 0 errors / 0 warnings.
- `deno task test`: passed; Deno 20 tests and Vitest 9 tests.
- `deno task design:check`, `deno task lint`, `deno task fmt:check`: passed; lint checked 116 files
  and formatting checked 145 repository files plus 4 ExecPlan files.
- `deno task build`: passed. The former ineffective SVX dynamic-import warning is absent.
- `deno task fonts:check`: passed; initial preload 261.3 KiB, all route subsets 451.1 KiB.
- `deno task budget:check`: passed; Article initial JavaScript 106.5 KiB gzip and Home WebGL
  JavaScript 211.1 KiB gzip.
- `deno task test:e2e`: passed against the local production preview; 22 passed and 38 skipped by the
  project matrix. This covers 308 redirects, GET SSR policy, no-JavaScript reading/search, 320/768
  layouts, 200% text, axe, reduced motion, forced colors, cursor fallbacks, reaction persistence,
  touch rotation with native vertical scrolling, responsive image delivery, and non-WebGL fallback.
- `deno task storybook:check`: passed; 42 stories with axe, responsive, editorial, motion, and WebGL
  fallbacks. The standard headless browser exposed no WebGL2, so context loss was also verified by
  running the same checker in headed Chromium under Xvfb, where WebGL2 was available. The headed
  check also verifies drag ownership, rotation updates, automatic resume, and `touch-action: pan-y`.
- `PREVIEW_URL=http://127.0.0.1:4174 deno task preview:audit`: passed; slow-network CLS 0.0029,
  three same-origin font requests, font-failure fallback, landmarks, crawler metadata, and 1200x630
  OGP.
- `git diff --check`: passed.

Known non-blocking build warnings are Vite's generic greater-than-500-KiB optional chunk warning,
plugin timing diagnostics, and adapter-auto's inability to select a production adapter locally. The
previous SVX split warning and concurrent eager-fetch warning have been removed.

Implementation-time regressions found and fixed: frontmatter-free SVX heading exports, computed CSS
seconds being interpreted as milliseconds in copy status, transient font-generation cleanup races,
Home visual overflow, Article controls at 200% text, prerendered redirects losing their 308 status,
dot-directory responsive images returning 404 in production preview, and WebGL input ownership not
reaching the auto timeline.

Still manual: the authenticated Deno Deploy preview/revision rollback, a real screen reader and
physical touch device, browser font cache/offline observation, and final inspection by an external
social crawler. Creating the remote preview requires an authorized commit/push to the GitHub-linked
Timeline; the current working tree remains intentionally uncommitted.
