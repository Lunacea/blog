# Newspaper technical blog — ExecPlan

## Goal and constraints

Implement the approved newspaper/paper redesign, keeping Home and the seven Article URLs. Remove
Works/Archive resources with 404 (including OGP); retain schemas, reaction API and KV. Use the
existing dirty working tree as baseline; do not stage, reset or commit user changes. Keep Articles
GET SSR, detail prerendering, optional enhancements and current bundle budgets.

## Milestones

- [x] Remove retired routes/content and references; regenerate content, validate IDs/links.
- [x] Newspaper default and list-only GET controls; update query and navigation tests.
- [x] Ordered composition metadata, minimap, text-derived paper stacks and focused tests.
- [x] Paper business card and centered concise Home profile; browser accessibility review.
- [x] Separately update architecture/design/content documentation; check/build/budget.

## Decisions

Newspaper uses existing view=grid; filtered URLs select list; switching to newspaper clears filters.
No pagination. Paper layers clamp ceil(prose characters / 1200) to 1–5. Minimap is decorative,
desktop only; existing TOC links own navigation. Existing Article IDs/slugs and public schemas stay
stable. No production dependencies added.

## Validation log

Pending. Record exact commands and outcomes as work proceeds. Build regenerates artifacts; generated
files must not be edited by hand. Deleted resources can be restored from the task diff; no KV
migration or irreversible storage operation is part of this change.

## Progress and findings

- Removed all Works/Archive routes and 11 entries; cleaned three now-empty related arrays. Seven
  Article records pass validation; schemas/API/KV remain unchanged.
- Implemented newspaper/list URL policy, ordered minimap metadata, paper stacks and profile.
- Updated architecture/design/content documentation independently and synchronized README.
- `deno task content:generate`: seven metadata and composition records generated.
- `deno task content:validate`: passed (7 entries).
- `deno test packages/content/composition.test.ts`: passed (4 tests).
- `deno task --cwd apps/web test:unit src/test/article-query.test.ts src/test/components.test.ts`:
  passed (12 tests). First server-load test could not resolve core aliases in Vitest; replaced with
  pure URL policy coverage and browser result coverage, without changing search semantics.
- `deno task --cwd apps/web check`: passed, zero errors/warnings.
- `deno task design:check`: passed.
- Initial build passed; initial JS 118.1 KiB gzip; Home WebGL 149.4 KiB gzip, both in budget.
- First browser run hit an unrelated server on occupied port 4173; own preview uses 4174. Second run
  identified input foreground missing in dark mode (fixed with semantic text-ink) and a test search
  string with common bigrams (changed fixture; search behavior unchanged).
- Desktop screenshots prompted smaller newspaper headlines and symmetric profile padding. Final
  production build/browser confirmation pending.

## Final validation

- Final `deno task build`: passed. Adapter-auto emits its usual local environment detection notice;
  deployment was not performed.
- `deno task budget:check`: Article 118.1 KiB gzip / 150 KiB; Home WebGL 149.4 KiB / 230 KiB.
- `deno task --cwd apps/web check`: zero errors and warnings after final source changes.
- `deno task design:check` and `git diff --check`: passed.
- `E2E_BASE_URL=http://127.0.0.1:4180 deno task --cwd apps/web test:e2e newspaper.spec.ts`: nine
  passed, two desktop-only scenarios skipped outside desktop, one theme audit needed stabilization.
  The remaining audit passed when rerun with `--project=desktop --grep 'paper layouts'`. Theme
  audits now wait for hydration and theme transitions before checking contrast; no violations.
  Combined coverage: ten passed and two intentional skips across desktop/mobile/no-JavaScript.
- `E2E_BASE_URL=http://127.0.0.1:4180 deno task --cwd apps/web test:e2e site.spec.ts --project=desktop
  --grep 'Grid and List|desktop Article TOC|catalog controls preserve|legacy URLs|back and forward|tag pages'`:
  five passed; the search surface assertion targeted a transparent wrapper rather than its opaque
  input. Corrected the assertion target; `--grep 'catalog controls preserve'` then passed. Combined
  related regression coverage: six passed.
- Desktop newspaper, mobile newspaper, paper profile and desktop minimap screenshots inspected.
  Profile center and keyboard article/TOC navigation also verified by browser assertions.
- Full Storybook and the entire unrelated API/weather/WebGL test suites were not run. Existing
  staged changes remain staged as supplied; this task neither stages nor commits anything.

## Final motion correction

A direct hover probe found that changing OS reduced-motion while hovering retained the paper
rotation when the application's stored mode was Full. Added explicit OS/coarse-pointer rotation caps
(with priority over the more specific hover selector). Rebuilt with
`deno run -A npm:vite@8.1.3 build` from apps/web; existing generated assets were already current.
`E2E_BASE_URL=http://127.0.0.1:4181 deno task --cwd apps/web test:e2e newspaper.spec.ts --project=desktop --grep 'paper lift'`
passed: Full hover rotates -1deg and OS reduced-motion immediately resets to 0deg. Budget remains
118.1 KiB Article / 149.4 KiB Home WebGL. Design check and diff whitespace check pass. Stopped the
two superseded task-owned previews; final preview remains on port 4181.
