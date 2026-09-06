# Design-system migration ExecPlan

Status: Complete

## Goal

Move the current UI to the repository's role-based design-system structure, make
`packages/ui/src/foundations/theme.css` the single theme source, introduce local Bits
UI/shadcn-style primitives and an offline Iconify abstraction, and preserve progressive enhancement
and the article bundle boundary.

## Constraints

- Deno remains the workspace package manager.
- Search remains a native GET form.
- Existing `@lunacea/ui` export names and local-storage keys remain compatible.
- Three/Threlte remain dynamically reachable from Home only.
- No icon data is fetched from a third-party service in the browser.

## Milestones

- [x] Create the planning and design-system documentation prerequisites.
- [x] Consolidate theme and global CSS under `packages/ui/src/foundations`.
- [x] Reorganize UI source by responsibility without breaking public exports.
- [x] Add local Collapsible/ToggleGroup primitives and the Icon abstraction.
- [x] Migrate navigation, reactions, preferences, and accessibility fallbacks.
- [x] Move visual ownership and consolidate OGP generation.
- [x] Share the SVX pipeline, add build-time KaTeX, and compose the public reading surface.
- [x] Add layout primitives plus typography, motion, editorial, and icon Storybook coverage.
- [x] Connect semantic interface, weather, location, display, and tag icons to public UI.
- [x] Run design, type, test, build, budget, and browser checks.

## Decisions

- `components.json` documents the local source layout; the shadcn CLI is not run because this
  workspace has no supported Node package-manager contract.
- Iconify receives bundled icon data objects. String-name API loading is not used because it would
  omit SSR SVG and add a third-party runtime request.
- User motion preference is stored unchanged, while OS reduced motion, save-data, and forced-colors
  cap the effective motion mode.
- A central cursor-state type is reserved in the public motion API, but no custom-cursor runtime is
  introduced; the native cursor remains the implementation.

## Progress notes

- Baseline: `check`, unit tests, lint, build, and budget passed; formatting failed only for the
  newly supplied untracked AGENTS documents.
- Theme values now live only in `packages/ui/src/foundations/theme.css`; Web and Storybook import
  the same global foundation layer. The former `packages/tokens` package and duplicated app-level
  theme aliases were removed.
- Existing public component names remain exported from `@lunacea/ui`, while role-based subpaths
  expose components, patterns, primitives, icons, motion, and visuals. The Three/Threlte graph is
  absent from the root barrel and remains a Home-only dynamic import.
- Bits UI transitive Svelte packages require Vite/Vitest `ssr.noExternal` entries so their rune
  sources are compiled consistently in the Deno workspace.
- Setting `data-js` before hydration produced a temporarily inoperable mobile menu. The header now
  enables its enhanced disclosure only after mount and remains navigable without JavaScript.
- Browser inspection found two responsive overflow cases: rem-based minimum widths at 200% text and
  the off-canvas AmbientHero geometry on a 412 px viewport. Responsive wrapping and a clipped Home
  visual boundary removed both without hiding the document scrollbar.
- Storybook now covers 41 stories across Foundations, Primitives, Components, Layout, Motion,
  Patterns, and Visuals, with shared theme/motion toolbars, project viewport presets, Autodocs, and
  an automated browser/axe validation task.
- Storybook browser validation exposed and fixed three implementation issues: unresolved
  `light-dark()` source text being passed to Three.js, intrinsic Input width at 320 px, and
  ContentList metadata that could not wrap at 200% text.
- Web and Storybook now consume the same mdsvex configuration for GFM, heading links, Shiki, Mermaid
  sources, and build-time KaTeX. The non-public editorial fixture covers the complete authoring
  contract without entering the content registry.
- Public layout primitives, semantic icon resolvers, `TagLabel`, and `ReadingSurface` are exported
  from role-based subpaths. Storybook adds Layout, Motion, Typography, Editorial, and semantic icon
  stories while production keeps its SvelteKit navigation import behind the Storybook mock.
- Screenshot review found Mermaid's generated viewBox greatly exceeded its graph bounds. The reading
  enhancement now normalizes the viewBox from the rendered graph group, preserving a compact
  responsive diagram and the source fallback when JavaScript is unavailable.

## Verification

- `deno task design:check`: passed.
- `deno task check`: passed; 18 content entries validated and Svelte reported 0 errors and 0
  warnings.
- `deno task test`: passed; 14 Deno tests and 9 UI tests.
- `deno task lint`: passed; 105 files checked.
- `deno task fmt:check`: passed; 132 files checked. The root AGENTS/ExecPlan/config files were also
  checked explicitly with `deno fmt`.
- `deno task build`: passed. The pre-existing ineffective content dynamic-import warnings and the
  adapter-auto deployment notice remain informational.
- `deno task budget:check`: passed; article initial JavaScript is 106.7 KiB gzip across 24 files,
  below the 150 KiB limit. The same check rejects Mermaid, Storybook, Threlte, and Three.js from the
  article initial graph.
- `deno task --cwd packages/ui build`: passed without the previous missing-Svelte-config or tooling
  chunk-size warnings.
- `deno task storybook:check`: passed; 41 stories, generated Docs, runtime console, axe, all-story
  320/768/1280/1600 px overflow, all-story 320/768 px at 200% text, mobile keyboard behavior,
  reduced motion, forced colors, editorial output, page-transition fallback, save-data, low
  capability, no-WebGL2, and context-loss cleanup.
- `deno task test:e2e`: passed; 17 applicable tests passed and 28 project/feature-specific cases
  were intentionally skipped. Coverage includes keyboard navigation, Escape/focus return, reduced
  motion, forced colors, no-JavaScript GET search and static editorial output, history navigation,
  accessibility, and narrow/tablet/200% text overflow. The development server still reports
  SvelteKit's eager-fetch diagnostic while concurrent weather API requests run during page
  rendering; it did not fail the suite, and no component-side fetch was found outside `onMount` or
  user-event handlers.
- Manual Playwright screenshot inspection covered desktop, mobile menu, and 200% text layouts. On
  the final 412 px mobile check, document client and scroll widths both measured 412 px.

## Remaining manual checks

- Review forced-colors appearance in a native Windows high-contrast environment; automated media
  emulation verifies the behavioral gates but not platform rendering details.
- Check WebGL rendering quality on representative physical low/high capability devices. Automated
  tests now cover capability gating, save-data, missing WebGL2, and context-loss cleanup.

## Rollback boundaries

- Foundations can temporarily restore the former token import without reverting component moves.
- Role-based source moves can be reverted through the public barrels without changing app routes.
- Bits UI/Iconify dependencies and their local wrappers can be reverted independently of theme
  ownership.
- Interaction/accessibility changes and visual/OGP ownership are separate change groups; neither
  requires changing content IDs, routes, storage, privacy behavior, or prerender boundaries.
