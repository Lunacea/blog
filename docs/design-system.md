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
preference is `auto`. Manrope followed by Zen Kaku Gothic New is the sans role. Newsreader followed
by Hina Mincho is reserved for large editorial headings and quotations. DotGothic16 remains limited
to named accents. Fira Code followed by system monospace is limited to fenced/inline code, keyboard
input, and technical identifiers. Dates, navigation, tags, and ordinary status text use the sans
role with tabular numerals where alignment is useful.

These fonts are self-hosted from repository-pinned OFL sources. The build derives hashed WOFF2
subsets from public content, UI strings, and configuration, emits the same generated CSS for Web and
Storybook, and never contacts Google Fonts at runtime. Only the regular sans Latin/Japanese faces
needed for first paint are preloaded; the preload budget is 350 KiB and the total initial-route
custom-font budget is 500 KiB.

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
save-data, or forced-colors constraints. Eligible route changes use a restrained root opacity and at
most 6px translation; individual page text is not flown in as shared content. Shared continuity is
limited to matching Article/Work media. Transitions preserve navigation, focus, scroll restoration,
and no-JavaScript access. Smooth scrolling is enabled for a user-clicked same-document anchor and
the bounded Home two-section snap assist; Reduced/Off uses immediate movement. The custom cursor is
available only for fine, hovering pointers in full motion and never replaces native input/selection
behavior.

The Header is a transparent fixed control layer rather than a horizontal bar. Its desktop region
stacks Articles, Works, and Archive at the safe-area-aware upper-right inset, followed by Theme and
Display; mobile keeps Theme, Display, and the hamburger in that order. It has no background,
decorative border, shadow, blur, or radius. Feed and sitemap endpoints do not appear in Header
navigation. Display and mobile navigation disclosures use the same unboxed, vertically stacked text
language as desktop navigation, with a short enter/exit transition. Glass treatment is limited to
the Home profile card, and the site has no global Footer. The profile card is a compact 18–22rem
identity surface containing only the authored profile asset, name, short field, and vertical
GitHub/X/Email links. Pointer movement is clamped to the Home About section, yields to links, text
selection, and vertical touch scrolling, and does not persist. Full motion may continue with short
damped inertia that stops at the section boundary; Reduced/Off removes inertia and tilt. The first
in-view appearance uses one restrained sub-15-degree rotation to suggest optional drag without
adding instructions; that one-shot animation is cleared before drag so opacity and transform remain
continuous into inertia. Introduction remains centered below the movable card, and the category
based Engineering list follows in a four/two/one-column responsive grid without card or pill chrome.

The shared Theme glyph uses tight local SVG bounds: a crescent for Dark and one filled circle for
Light. Both shapes use the same visible outer square and center, without hidden viewBox padding.
Header and the `Lunacea` title reuse this definition while keeping their hit-area and typographic
sizing independent; the title motif is also a keyboard-accessible Theme toggle while the heading's
accessible name remains `Lunacea`. Registered semantic color properties interpolate theme changes
over the existing base/slow motion tokens; Reduced/Off remains immediate.

WebGL remains a Home-only optional enhancement loaded dynamically after capability checks. Static
weather ambience, primary text, and navigation exist before it loads and remain when it fails; no
unrelated central substitute geometry is shown. One Canvas shares its renderer between a background
weather environment and the independent central Hero. The Hero still morphs equal-size deterministic
point sets through a Möbius strip, a sphere/point cloud, and a regular octahedron. Point sprites use
small soft diamonds rather than circular droplet shapes. Low quality uses at most 1400 Hero points
and DPR 1.2; high quality uses at most 3200 Hero points and DPR 1.5. Other routes use a CSS-only
weather backdrop. Reduced motion, save-data, forced colors, and Display Off hide the Home central
motif rather than substituting unrelated geometry. The Home visual layer is full-bleed across the
Hero and About continuum while prose keeps its content width. Scroll never owns or pauses the WebGL
timeline; pointer drag may only change the Hero observation angle while preserving vertical touch
scrolling.

Weather motion uses a seamless shared phase in the Home shader. Clear renders slowly drifting,
leaf-filtered light shafts; Cloudy layers moving fog; Rain grows sparse glass-surface droplets; Snow
combines falling flakes with a gently changing lower accumulation line. Non-Home CSS uses sparse
droplets, flakes, and diffuse light with exact tile-period endpoints, so the last frame joins the
first without a jump. Development builds may preview `clear`, `cloudy`, `rain`, `snow`, or `neutral`
through the `?weather=` query; production ignores that override and continues to use fixed-location
weather.

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
