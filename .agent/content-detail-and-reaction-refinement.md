# Content detail and reaction refinement

## Goal

Unify tag and Archive presentation with the current catalog and Work detail language, keep noise
away from editorial text, simplify anonymous reactions to one praise action, add privacy-preserving
share links, and make the custom cursor become a text caret over Article prose.

## Non-goals

- Content slugs, canonical routes, frontmatter, prerendering, and article search behavior do not
  change.
- Social networks are not loaded through third-party scripts and no tracking SDK is added.
- Existing three-kind reaction KV records are not migrated or read.

## Constraints

- SvelteKit remains the only deployment unit and Deno KV stays behind `ReactionRepository`.
- Reaction mutations retain same-origin validation, payload limits, signed anonymous actors, rate
  limiting, and atomic aggregate/selection updates.
- Tag pages remain prerendered and readable without JavaScript.
- Article routes must not import Home/WebGL dependencies.
- Existing user changes in the worktree must be preserved.

## Milestones

1. Align the tag page and Archive detail with catalog/Work layout. Acceptance: tag route uses the
   compact catalog heading/list; Archive detail uses the same left-aligned image-led frame and
   metadata rhythm as Work; media-led details have no rule directly below the cover.
2. Refine Article reading presentation. Acceptance: TOC text is one step larger; Article header,
   prose surface, tail, and catalog text mask the global noise with semantic backgrounds; Article
   prose visibly morphs the custom square into the reading-text caret; Mermaid keeps compact
   geometry in Full, Reduced, and Off.
3. Replace reactions and add sharing. Acceptance: schemas, core, repositories, API, and UI expose
   one `count` and one `selected` boolean; PUT targets the content endpoint without a kind; the X
   Share link is a plain outbound link with no third-party runtime.
4. Synchronize contracts and verify. Acceptance: architecture/design/content docs reflect the
   incompatible reaction reset and new UI; targeted unit/API/E2E checks, Svelte check, format, lint,
   design check, build, and budget checks have recorded outcomes.

## Progress

- [x] Current routes, shared UI, reaction boundary, persistence implementations, and tests
      inspected.
- [x] Milestone 1 implemented and verified in desktop/mobile browser coverage.
- [x] Milestone 2 implemented and verified, including Mermaid geometry and the custom cursor.
- [x] Milestone 3 implemented and verified across API, component, and browser checks.
- [x] Milestone 4 completed; one unchanged SiteHeader visual-baseline drift remains documented.

## Decisions and discoveries

- The apparent cover underline is the top border of the following `ReadingSurface`, not image
  decoration.
- Noise masking is limited to a tight theme-colored shadow immediately behind editorial glyphs;
  Article layout blocks remain transparent.
- Tag URLs remain stable; their page is restyled rather than redirected because one tag can span
  Articles, Works, and Archive records.
- The single praise model uses new kindless KV keys. Old per-kind keys are intentionally ignored, as
  backward compatibility was explicitly waived.
- Share uses one X intent URL as an ordinary link adjacent to the praise control. No external
  script, cookie, or client SDK is introduced.
- Reduced/Off disable animation on Mermaid's generated SVG subtree explicitly. The temporary Mermaid
  measurement tree is exempt from the global duration override so all motion modes produce the same
  compact viewBox.

## Validation log

- `deno task test`: passed, with 22 Deno tests and 14 Vitest tests.
- `deno task --cwd apps/web check`: passed with zero errors and warnings.
- `deno task --cwd apps/web test:unit -- --run src/test/components.test.ts`: passed, 14 tests.
- `deno task --cwd apps/web test:e2e --grep "Mermaid geometry|anonymous praise|custom cursor"
  --project=desktop`:
  Mermaid and cursor passed; the praise test exposed test ordering and selected background
  assertions, which were corrected.
- `deno task --cwd apps/web test:e2e --grep "anonymous praise" --project=desktop`: passed after the
  corrected final implementation and assertion.
- Earlier targeted desktop E2E for Article TOC, Work detail, Archive detail, tag route,
  praise/share, and custom cursor passed 7/7; the mobile TOC check passed separately.
- `deno task fmt:check`, `deno task lint`, and `deno task design:check`: passed.
- `deno task build`: passed.
- `deno task budget:check`: passed at 90.3 KiB gzip for Article initial JavaScript and 150.5 KiB
  gzip for Home WebGL.
- `deno task storybook:check`: Storybook built successfully, then the pre-existing
  `components-siteheader--desktop.mobile.light.png` baseline differed by 0.830%. The changed file
  set does not include SiteHeader.

## Remaining risks

- The unrelated SiteHeader visual baseline must be reviewed or regenerated separately.
- The incompatible praise model intentionally starts from new kindless KV keys; old per-kind totals
  are not shown.
