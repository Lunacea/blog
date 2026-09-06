# Articles front page redesign — ExecPlan

## Goal

Rebuild `/articles` as a newspaper front page whose hierarchy, typography and paper metaphor carry
the design argument, following the reference reading of NYT/NewsPicks front pages.

User-visible goals:

- Search moves out of the catalog body into the site Header and stays reachable from every route.
- The oversized `Articles` display title is removed; only a thin folio line remains.
- Category classification is always visible at the top of the catalog, in both views.
- A deterministic daily serendipity band re-surfaces older articles.
- The horizontal paper bar under every record is removed; paper becomes a small stacked corner mark
  whose top sheet peels at the bottom right.
- One sheet represents one reading minute instead of 1,200 prose characters.

Non-goals: new content, new production dependencies, changes to Article URLs, IDs, schemas, reaction
API, KV, prerendering of Article detail, or the Home route.

## Constraints

- SvelteKit stays the only deployment unit; `/articles` stays GET SSR with its existing cache and
  `noindex,follow` policy for filtered URLs.
- No `<style>` blocks; Tailwind utilities and `foundations/theme.css` tokens only.
- Search, facets and view switching keep working without JavaScript.
- Keyboard access, heading structure, focus, forced colors, reduced motion and 200% text hold.
- Initial JS and Home WebGL budgets stay inside `apps/web/scripts/check-budget.ts`.

## Decisions

- View policy simplifies to the `view` parameter alone: filters no longer force the list, because
  categories are always visible and the Header search is always reachable. The Header search form
  submits `view=list`, so search results still land on the list.
- Serendipity is deterministic per UTC day (seeded PRNG over the pool below the front section), so
  SSR output stays cacheable and hydration-stable. Its picks are removed from the remaining grid, so
  no article is printed twice.
- Paper layers clamp `ceil(estimatedMinutes)` to 1–5. `paperLayerCount` keeps its name and clamp.
- The Header gains a fourth control column; `--header-inline-reserve` grows to match it.

## Milestones

- [x] Content: minute-based paper layers, regenerated composition, focused tests.
- [x] UI: paper corner mark, catalog preview variants, category strip, Header search.
- [x] Web: view policy, serendipity load, rebuilt catalog page.
- [x] Tests: unit and end-to-end coverage updated for the new surfaces.
- [x] Documentation updated separately from implementation; validation commands recorded.

## Follow-up scope (fifth instruction set)

Search leaves Home and the reading surface and stays on the catalog. The site's own glyphs (Search,
paper mark, contents index, praise heart, scroll indicator) are redrawn in the Display glyph's
stroke language, and Display gains a Japanese tooltip instead of an English title. Praise loses its
box and its invitation line, and celebrates with the heart blooming across the viewport behind a
handwritten `Thank you!`. Home's intro grid is repaired after the role line was removed, and the
rolled newspaper is withdrawn - the About group keeps its ordinary Articles link.

## Follow-up scope (fourth instruction set)

Mobile contents move onto the Header line with a filled trigger and a downward panel, and lose the
heading count. Catalog category chips keep a rule at rest, and the glyph mask no longer haloes the
filled tag chips. The Article detail byline drops the paper mark and reading time. Home loses its
top-left role line.

## Follow-up scope (third instruction set)

Mobile contents move into the Header line itself with a downward panel, no full-width trigger and no
trigger background. OG thumbnails show the whole image. Mermaid stops shrinking below a legible
scale and scrolls instead. The daily box becomes 本日のPick Up without a boxed background or note.
そのほかの記事 becomes an impression ranking in a right-hand rail on desktop, which required a new
anonymous per-article impression counter (KV, API route, client beacon). The praise control moves to
a centred post-reading position with an optimistic count and a one-shot celebration.

## Follow-up scope (same task, second instruction set)

Article detail: the table of contents becomes a folded `目次` header at the top left on mobile while
desktop keeps its right-hand column (user decision); the header metadata block tightens; remaining
English metadata labels become Japanese; and the desktop minimap follows rendered heights rather
than source estimates. A further Home item was deferred by the user.

## Progress and findings

- Paper layers now follow reading minutes: the seven sample articles moved from a uniform single
  sheet to 1–3 sheets, so the mark finally carries information.
- `ArticlePaperStack` (the horizontal bar) is replaced by `PaperStackMark`, a stacked sheet glyph
  whose front corner is folded; hover and keyboard focus widen the fold through a registered
  `--paper-dogear` length. `ReadingLength` pairs it with the minutes figure, so the visual has a
  text equivalent in both views and on the detail byline.
- The front section is a lead plus one secondary record. A three-record front left the lead column
  visibly empty next to the taller rail, which a two-record front resolves.
- Column and boxed records dropped their tag chips; the chips competed with the headlines and the
  category already labels each record.
- The Tailwind migration in the working tree had dropped the catalog glyph mask and mistyped the
  detail heading mask utility (`shadow-ui-text-mask` matches no token). Both now use
  `text-shadow-ui-mask`, restoring the documented masking.
- The detail composition map is measured from the rendered prose through a `ResizeObserver`, so
  Mermaid diagrams, images and fonts change the map and the TOC row heights once laid out.
  Build-time estimates remain the first paint and the no-JavaScript state.

- The detail header's spacing problem was not typographic: `.page`'s `min-height: 65vh` made the
  header grid stretch its rows, inflating every metadata row (the flags row measured 75px around a
  32px chip). `content-start` plus `min-h-0` restores content-sized rows.

## Known pre-existing failures (not from this task)

Two end-to-end expectations describe the Home that the working tree's own staged redesign replaced:
the desktop and mobile navigation lists still expect the retired `Works` and `Archive` entries, and
`home is a continuous document` still expects an `Engineering` level-2 heading that the staged Home
no longer renders. Both fail before and after this task.

## Validation log

- `deno test --allow-env --allow-read --unstable-kv packages/api`: 9 passed, including the new
  impression repository and endpoint coverage.
- `deno test packages/content/composition.test.ts`: 5 passed (minute-based layers, long-article
  case).
- `deno test --allow-env --allow-read --unstable-kv packages/content/composition.test.ts packages/core
  packages/schemas`:
  17 passed.
- `deno task content:generate` and `deno task content:validate`: 7 entries; layers now 1-3.
- `deno task --cwd apps/web check`: 0 errors, 0 warnings.
- `deno task --cwd apps/web test:unit`: 21 passed (5 files), including the rebuilt catalog tests.
- `deno task design:check`: passed. `deno fmt` applied to touched files only; README.md,
  apps/web/vite.config.ts and packages/config/mod.ts remain unformatted from the user's own edits.
- `deno lint apps packages e2e`: one pre-existing `no-var` finding in the stray generated file
  `apps/web/vite.config.ts.timestamp-*.mjs`, untouched by this task.
- `E2E_BASE_URL=http://127.0.0.1:4173 deno task --cwd apps/web test:e2e` (whole suite, final run):
  48 passed, 78 skipped by project, 3 failed - and all three failures are the pre-existing ones
  recorded above (two navigation lists expecting the retired Works/Archive entries, and the Home
  `Engineering` heading the staged Home no longer renders). Every specification this task touched
  passes, including the newspaper spec across desktop, mobile and no-JavaScript. Two test-only
  stabilisations were needed: the theme audit stops awaiting `requestAnimationFrame` in the
  no-JavaScript project, where frame callbacks never run, and it now gets a 60 second budget because
  it audits four routes in two themes.
- `deno task build` and `deno task budget:check`: Article initial JS 119.7 KiB gzip / 150 KiB, Home
  WebGL 149.3 KiB / 230 KiB.
- Browser verification: newspaper and list at 1440 and 390 in both themes, the Header search panel,
  the corner peel at rest and hovered, and the article detail header, mobile 目次 header and desktop
  minimap. The minimap check compared measurements: TOC row shares 24.4/25.5/15.3/12.1/22.7 against
  rendered section shares 24.4/25.5/15.3/12.1/22.8, and the Mermaid figure band 55.3-61.4 against
  its accent band 55.3-60.9.
