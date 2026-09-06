# Tailwind CSS and UI package consolidation

## Goal

Make Tailwind CSS 4 utilities the only component-styling mechanism, consolidate reusable Web UI into
`packages/ui`, remove dead or duplicate code, and leave the current redesign, public routes,
rendering boundaries, content identities, reaction privacy, and graceful fallbacks intact.

## Non-goals

- No content schema, route, storage, privacy, deployment, or prerendering migration.
- No new production dependency or JavaScript Tailwind configuration.
- No generic shadcn dashboard treatment or fabricated authored artwork.
- No discard, staging, commit, or rewrite of user-owned changes that are unrelated to this work.

## Constraints

- The dirty worktree and the incomplete header/Works/composition redesign are the implementation
  baseline. This plan supersedes only that plan's remaining implementation and validation work.
- Svelte files finish with no `<style>` blocks. Tailwind configuration, document/generated-content
  foundations, native View Transition selectors, and keyframes remain in owned CSS files.
- Dynamic inline styles are limited to data-driven CSS custom properties, aspect ratios, SVG
  geometry, and View Transition names.
- Web retains routing, SEO, generated-image resolution, API access, and data composition. UI
  components remain presentational and preserve the accepted dependency directions.
- Content, navigation, and controls continue to work without JavaScript wherever documented.

## Milestones

1. Record baseline and create this plan without modifying existing user-owned behavior.
2. Register the complete Tailwind theme/variant/animation vocabulary and refactor primitives and
   layout components to utility classes.
3. Consolidate link selectors, badges, actions, catalog controls, responsive media, reactions, and
   content detail presentation in `packages/ui`; retain thin Web adapters.
4. Convert every remaining Svelte component and route to Tailwind utilities, then remove obsolete
   components, styles, tokens, and exports.
5. Enforce the styling/package rules, repair the root test task, and synchronize AGENTS and design/
   architecture documentation as a separate documentation milestone.
6. Run formatting, lint, design, Svelte, content, unit, Storybook, E2E, build, budget, and diff
   checks; record exact results and remaining physical-device review.

## Progress

- [x] Repository status, accepted architecture, design system, package instructions, shadcn-svelte
      skill, current style inventory, and baseline checks inspected.
- [x] Milestone 2 — Tailwind CSS-first theme, semantic namespaces, custom variants, utilities, and
      animation vocabulary consolidated in shared foundations; primitives and layouts converted.
- [x] Milestone 3 — selectors, badges/actions, catalog controls, responsive media, controlled
      reactions, sharing, and detail presentation consolidated in `packages/ui` with thin Web
      adapters.
- [x] Milestone 4 — all Svelte `<style>` blocks removed; obsolete selectors/select/stories and the
      duplicate Web stylesheet removed; shared foundations imported by Web and Storybook.
- [x] Milestone 5 — design-system enforcement, root test targeting, AGENTS, architecture, and design
      documentation synchronized.
- [x] Milestone 6 — repository checks, Storybook baselines, E2E, production build, gzip budgets, and
      final whitespace validation completed.

## Decisions and discoveries

- Tailwind 4.3.1 is already installed and uses CSS-first configuration; no `tailwind.config` is
  required.
- The current baseline has 57 Svelte style blocks, a passing design check and lint, Svelte check
  with one CatalogControls warning, and unit tests with one obsolete CatalogControls DOM assertion.
- The root `test` task references the absent `hero-creature.test.ts`; it will target the extant
  `hero-geometry.test.ts` instead.
- `PageHead`, HomeSnapController, reaction networking, and generated image registry resolution stay
  in Web. Their reusable visual surfaces move to UI.
- Runtime-generated class names are not used; variant maps contain complete static class strings so
  Tailwind source detection remains reliable.
- Tailwind's automatic scan did not cover both sides of the workspace boundary reliably. Shared
  foundations now declare explicit `@source` roots for `packages/ui/src` and `apps/web/src`; this
  restored responsive, state, touch, color, and typography utilities in both builds.
- Raw typography values use internal `--type-*` variables while Tailwind-facing `--text-*`,
  `--leading-*`, and `--tracking-*` variables live in the official theme namespaces.
- Stable semantic class names remain as test/measurement hooks, but no longer own component CSS.

## Validation log

- Baseline `deno task design:check` — passed.
- Baseline `deno task lint` — passed, 136 files.
- Baseline `deno task --cwd apps/web check` — passed with 0 errors and one CatalogControls warning.
- Baseline `deno task test:unit` — failed: 15 passed, one obsolete CatalogControls DOM assertion.
- Final `deno task fmt:check` — passed, 166 files.
- Final `deno task lint` — passed, 136 files.
- Final `deno task design:check` — passed; zero Svelte `<style>` blocks and all enforced boundaries
  validated.
- Final `deno task content:validate` — passed, 18 entries.
- Final `deno task fonts:check` — passed; 166.6 KiB preload and 451.3 KiB all-route subsets.
- Final `deno task test` — passed; 22 Deno tests and 16 Vitest tests.
- Final `deno task --cwd apps/web check` — passed with zero errors and zero warnings.
- Final Storybook production build and `deno run -A packages/ui/scripts/check-storybook.ts` —
  passed; 59 stories, axe, responsive, reviewed visual baselines, editorial, motion, and WebGL
  fallbacks.
- Final `E2E_BASE_URL=http://127.0.0.1:4173 deno run -A npm:playwright@1.61.1 test` — passed; 48
  applicable tests and 81 intentional project skips.
- Final `deno task build` — passed. Vite retained its informational large-chunk warning and the
  adapter-auto environment notice.
- Final `deno task budget:check` — passed; Article initial JavaScript 122.7 KiB gzip (150 KiB
  limit), Home WebGL 150.5 KiB gzip (230 KiB limit).
- Final `git diff --check` — passed.

## Remaining risks

- Updated representative light/dark and mobile/desktop baselines were visually reviewed before the
  final deterministic comparison passed.
- Physical-device touch/trackpad feel remains a manual follow-up; automated Chromium coverage for
  touch scrolling, horizontal rail input, WebGL fallback, reduced/off motion, and View Transition
  fallback passed.

## Outcome

The accepted redesign now has one Tailwind CSS-first styling system, zero component style blocks,
shared UI compositions at the package boundary, controlled network-independent UI surfaces, and CI
guards against regressions. Public HTTP contracts, content identities, privacy behavior, and
rendering boundaries were not changed by this consolidation.

## Follow-up regression corrections

- Restored the visible Header theme glyph after a broad child `span` selector had applied the
  visually-hidden recipe to the glyph wrapper.
- Restored continuous Display glyph interpolation by transitioning the individual CSS `scale` and
  `translate` properties, while retaining operating-system reduced-motion handling.
- Added discrete `details-content` height/opacity transitions so compact catalog filters animate in
  both directions, and aligned search/reset controls to the shared control size.
- Restored the profile card's semantic glass background, border, highlight, blur, and shadow.
- Applied every canonical-class suggestion reported by the Tailwind 4.3.1 language server across Web
  and UI sources, then re-ran it with zero diagnostics.
- Added a package UI TypeScript configuration and Svelte declaration coverage, typed SvelteKit route
  handlers through generated `$types`, broadened `cn()` to Svelte's class-value contract, and
  aligned workspace extension settings with the checked Deno/Svelte/Tailwind configuration.
