# Design system

Status: Accepted

The design system is owned by `packages/ui`. Its implementation follows the package instructions in
`packages/ui/AGENTS.md` and the nested motion and visual instructions.

## Foundations

`packages/ui/src/foundations/theme.css` is the only source of reusable design values. It defines
semantic color, typography, spacing, layout, shape, depth, motion, breakpoint, and stacking tokens.
`global.css` owns selectors, resets, scrollbars, forced-color behavior, and browser fallbacks, and
must consume those tokens rather than define a second scale.

The light and dark themes retain the same semantic roles. System preference is used when the stored
preference is `auto`. Zen Kaku Gothic New 400/500/700 is the sans role, Hina Mincho 400 is the
editorial serif role, and DotGothic16 400 is limited to named accents. System monospace remains the
role for dates, coordinates, status, and code.

These fonts are self-hosted from repository-pinned OFL sources. The build derives hashed WOFF2
subsets from public content, UI strings, and configuration, emits the same generated CSS for Web and
Storybook, and never contacts Google Fonts at runtime. Zen 400 and Hina 400 are the only preloads;
the preload budget is 350 KiB and the total initial-route custom-font budget is 500 KiB.

## Components and behavior

Low-level controls live in `primitives` and use Bits UI or local shadcn-svelte source when focus,
selection, disclosure, or ARIA behavior is non-trivial. Native controls remain preferred when they
provide the required behavior and progressive enhancement, including the GET search form.

Application routes consume the package's public exports rather than Bits UI or icon libraries
directly. Semantic components may depend on public schemas and configuration but do not own external
repositories.

Spatial composition uses the public `Container`, `Section`, `Stack`, `Cluster`, `Grid`, `Split`, and
`Bleed` primitives. They add layout only; spacing and responsive values resolve to foundation
tokens.

Editorial SVX compilation is shared by Web and Storybook through the UI-owned mdsvex configuration.
`ReadingSurface` owns prose composition, table of contents, code copying, and lazy Mermaid
rendering. Inline and display math are converted to KaTeX HTML at build time without a client math
runtime.

## Icons and authored media

UI icons resolve through `icons/Icon.svelte`. General UI uses Solar linear; official technology and
service marks use Simple Icons. Semantic resolvers cover interface actions, weather state, and tags;
unknown tags use the common tag icon. Icon data is bundled so the server renders SVG without a
browser request to an icon service.

Authored organic imagery is supplied through `config.visualAssets` and `MediaSlot`. Missing assets
use `AssetPlaceholder` with a stable ID, role, aspect ratio, file type, accessibility description,
and transparency need.

## Motion and resilience

Motion clarifies state and hierarchy. The effective motion mode never exceeds OS reduced-motion,
save-data, or forced-colors constraints. Page transitions do not apply a root fade and must preserve
navigation, focus, scroll restoration, and no-JavaScript access. Smooth scrolling is enabled only
for a user-clicked same-document anchor. The custom cursor is available only for fine, hovering
pointers in full motion and never replaces native input/selection behavior.

WebGL remains a Home-only optional enhancement loaded dynamically after capability checks. Static
geometry, primary text, and navigation exist before it loads and remain when it fails. The scene
morphs equal-size deterministic point sets through a Möbius strip, a sphere/point cloud, and a
regular octahedron. Low quality uses at most 900 points and DPR 1.2; high quality uses at most 2400
points and DPR 1.5. Scroll and drag temporarily own the shared timeline, which aligns to a hold
state before automatic motion resumes.

## Storybook

Storybook imports the same `foundations/global.css` used by Web. Its toolbar exposes the semantic
theme, effective motion request, and project viewport presets without defining a second token
system. Stories are grouped by the design-system ownership boundaries: Foundations, Primitives,
Components, Layout, Motion, Patterns, and Visuals. The editorial pattern uses a non-public SVX
fixture that exercises headings and TOC, annotation, quote, highlighted code, Mermaid, and KaTeX.

`deno task storybook:check` builds Storybook and validates every story for runtime errors, axe
violations, horizontal overflow at narrow mobile, tablet, desktop, and wide desktop widths, and 200%
text at narrow and tablet widths. It also checks editorial output, page-transition and reveal
behavior, mobile-menu keyboard dismissal, motion and forced-color caps, save-data and low-capability
fallbacks, missing WebGL2, and context-loss cleanup.
