# Catalog, detail, and transition redesign

## Goal

Unify catalog records, make Work and Archive details image-led and compact, add stable numbering and
adjacent navigation, and provide optional spatial motion without making content depend on JavaScript
or WebGL.

## Non-goals

- Content slugs, canonical detail routes, frontmatter schemas, and content IDs do not change.
- Article rendering does not import Three.js.
- Missing authored Work imagery is not replaced with invented artwork.

## Constraints

- Existing user-owned worktree changes must be preserved and incorporated.
- Catalog/detail HTML, links, titles, and covers remain complete without JavaScript.
- WebGL is dynamically imported only for the Works grid and is gated by motion, capability,
  save-data, forced-colors, and visibility conditions.
- Reduced/Off motion, coarse pointers, unsupported View Transitions, and browser history remain
  functional immediate fallbacks.
- Architecture and design-system contract updates remain separate from implementation edits.

## Milestones

1. Make ContentList the canonical ruled record and align Article/Work/Archive catalog typography.
2. Add tag-filter routing, remove tag pages, and update sitemap/content validation.
3. Add Work/Archive sequence data, image-led detail composition, compact grouped metadata, and
   adjacent navigation.
4. Add title/count/directional View Transitions, optional Works-grid WebGL, and mobile TOC fixes.
5. Synchronize architecture/design documentation and execute the full validation matrix.

## Progress

- [x] Existing worktree, accepted architecture, package instructions, components, routes, tests,
      reference page, and current bundle checker inspected.
- [x] Milestone 1
- [x] Milestone 2
- [x] Milestone 3
- [x] Milestone 4
- [x] Milestone 5

## Decisions and discoveries

- Numbering is newest-first, one-based, non-circular; Archive is one sequence across all kinds.
- `/tags/:tag` is intentionally retired without a compatibility route.
- Shared title continuity applies to Articles, Works, and Archive.
- Existing Work samples use structural placeholders. Their semantic labels remain visible; the WebGL
  layer may add restrained geometric motion but cannot pretend they are authored covers.
- The repository uses Deno and has Bits UI already installed, so Separator is implemented as a small
  local source primitive rather than invoking an unsupported Node package-manager runner.

## Validation log

- `deno task fmt:check` — passed; 162 files checked.
- `deno task lint` — passed; 131 files checked.
- `deno task --cwd apps/web check` — passed; 0 errors and 0 warnings.
- `deno task content:validate` — passed; 18 content entries validated.
- `deno task design:check` — passed.
- `deno task build` — passed.
- `deno task budget:check` — passed: Article 89.2 KiB gzip, Home WebGL 153.2 KiB gzip, Works WebGL
  151.1 KiB gzip.
- `deno task test:unit` — passed; 15 tests.
- `deno test --allow-env --allow-read --unstable-kv packages/core packages/schemas packages/api
  packages/ui/src/visuals/hero-geometry.test.ts packages/ui/src/visuals/weather-visual.test.ts`
  — passed; 22 tests.
- `deno task test:e2e --project=desktop --grep "Article and Work list views|Work detail is
  image-led|Work sequence navigation|Archive detail follows|tag pages are retired|Works WebGL is
  optional"`
  — passed; 6 tests.
- Targeted Playwright mobile TOC test — passed; 1 test.
- Targeted Playwright Works WebGL lifecycle test — passed; 1 test.
- Targeted Playwright final Work/Archive layout tests — passed; 3 tests.
- `deno task test` — cannot start because its pre-existing task points to the absent
  `packages/ui/src/visuals/hero-creature.test.ts`; the extant Deno suites and unit task were run
  directly above.
- `deno task storybook:check` — Storybook built and checks ran, then the pre-existing SiteHeader
  mobile-light baseline differed by 0.830% (`components-siteheader--desktop.mobile.light.png`).
- `git diff --check` — passed.
- One incorrectly forwarded Playwright invocation began the full suite and was stopped after the
  mistake was visible; it is not counted as a validation result. The corrected targeted command is
  recorded above.

## Remaining risks

- Shared View Transition behavior needs physical-browser review because support differs by engine.
- GPU quality and scroll feel require representative desktop hardware review after automated
  capability and cleanup checks pass. Automated cleanup and fallback checks passed.
