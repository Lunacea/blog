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
save-data, or forced-colors constraints. Eligible route changes animate only the `main` content with
restrained opacity and at most 6px translation; fixed Header and other persistent chrome remain
stationary. Shared continuity is limited to matching Article/Work media. Transitions preserve
navigation, focus, scroll restoration, and no-JavaScript access. Smooth scrolling is enabled for a
user-clicked same-document anchor and the bounded Home two-section snap assist; Reduced/Off uses
immediate movement. The custom cursor is available for fine, hovering pointers in Full and
explicitly selected Reduced modes, but capability-limited Reduced and Off retain the native cursor.
It never replaces native input/selection behavior.

The Header is a transparent fixed control layer rather than a horizontal bar. Its desktop region
stacks Home, Articles, Works, and Archive at the safe-area-aware upper-right inset, followed by
Theme and Display; mobile keeps Theme, Display, and the hamburger in that order. It has no
background, decorative border, shadow, blur, or radius. Feed and sitemap endpoints do not appear in
Header navigation. Display is one icon button that cycles Full, Reduced, and Off while exposing the
current and next state through its accessible name. Its glyph is a straight line for Off, one wave
for Reduced, and two waves for Full. Both paths share one point-symmetric sine curve with one crest
and one trough; switching mode interpolates amplitude and position. Full and an explicitly selected
Reduced mode advance one seamless phase on hover, while Off and capability-limited reduced motion
remain static. Theme controls remain transparent in both themes and communicate state through the
sun/moon glyph, color, and accessible name; the title glyph keeps the accent color through hover and
focus. The mobile navigation disclosure uses compact stacked text with a short enter/exit
transition. Selected navigation, filter, view, and reaction states use rectangular semantic-color
fills instead of underline markers. Non-Home pages reserve the fixed control region before first
paint: desktop content uses a shared inline-end reserve and aligns its top edge with the navigation,
while mobile retains only the three-button top clearance. On Article detail, reaching the reading
surface fades the desktop links into the same Theme, Display, and hamburger controls used on mobile;
returning above the surface restores them. Glass treatment may appear on temporary interactive
surfaces such as an open menu, mobile table of contents, or hover media overlay, but not as a
permanent Header, catalog filter, or reading-surface background. The site has no global Footer.
Header navigation and Display may use a clipped rectangular fill sweep without moving their control
boxes; navigation rows keep the same full width for hover and active fills. Theme is excluded from
that sweep and changes only to the title's accent color on hover/focus. Theme and Display remain on
the same vertical baseline. The filled hamburger moves its two parallel lines slightly while closed;
its open cross stays centered and rotates 90 degrees in place on hover/focus. Reduced/Off applies
state immediately. The custom pointer is a rotating heavy square outline rather than a circular
ring. Unlabelled actionable targets settle as an unfilled diamond. Labelled targets first settle at
a right angle, then extend horizontally; Article-list “View more” keeps that rectangle fixed while
one wide diagonal band travels through it on an exact repeating tile. Fine-pointer cursor labels
identify the whole draggable profile card, Article-list links, external previews, and code-copy
actions as “Drag it!”, “View more”, “Open external”, and “Copy code” respectively; native cursors
remain in all capability fallbacks. The profile card is a compact 18–22rem identity surface
containing only the authored profile asset, name, short field, and vertical GitHub/X/Email links.
Pointer movement is clamped to the Home About section, yields to links, text selection, and vertical
touch scrolling, and does not persist. Full motion may continue with short damped inertia, allow a
token-bounded rubber-band overshoot, and spring back inside the boundary; Reduced/Off removes
inertia, overshoot, and tilt. The first in-view appearance uses one restrained sub-15-degree
rotation to suggest optional drag without adding instructions; that one-shot animation is cleared
before drag so opacity and transform remain continuous into inertia. Introduction remains centered
below the movable card, and the category based Engineering list follows in a four/two/one-column
responsive grid without card or pill chrome.

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
point sets through a Möbius strip, a sphere/point cloud, and a regular octahedron. Fine-pointer
proximity repels a compact local radius around nearby points in screen space and eases back after
pointer exit. Point sprites use small soft diamonds rather than circular droplet shapes. Low quality
uses at most 1400 Hero points and DPR 1.2; high quality uses at most 3200 Hero points and DPR 1.5.
Other routes use a CSS-only weather backdrop. Reduced motion, save-data, forced colors, and Display
Off hide the Home central motif rather than substituting unrelated geometry. The Home visual layer
is full-bleed across the Hero and About continuum while prose keeps its content width. Scroll never
owns or pauses the WebGL timeline; pointer drag may only change the Hero observation angle while
preserving vertical touch scrolling.

Weather motion uses a seamless shared phase in the Home shader. Clear renders slowly drifting,
leaf-filtered light shafts; Cloudy layers moving fog; Rain grows sparse glass-surface droplets; Snow
combines falling flakes with a gently changing lower accumulation line. Non-Home CSS uses sparse
droplets, flakes, and diffuse light with exact tile-period endpoints, so the last frame joins the
first without a jump. Development builds may preview `clear`, `cloudy`, `rain`, `snow`, or `neutral`
through the `?weather=` query; production ignores that override and continues to use fixed-location
weather.

Article and Work list views use compact ruled rows. On fine hovering pointers, a row with authored
media may reveal that media as a viewport-scale background while a translucent contrast surface
keeps the selected row readable; touch and coarse-pointer layouts remain static. Catalog search and
facets are always visible without an outer panel, show the matching record count and per-facet
counts, and remain link/form based. Search submit uses a labeled icon. Facet options are compact
square rectangles: inactive options are transparent with a rule, and active options use a semantic
fill. Result count and the always-reserved reset slot remain left-aligned; reset uses the same icon
button dimensions in enabled and disabled states. Grid/List, facet, GET search, and reset navigation
preserve scroll and focus when enhanced, while their ordinary links/forms remain usable without
JavaScript. Grid/List controls use labeled icons. Full motion uses item-level View Transitions when
only the public `view` query changes; root content does not fade, and Reduced/Off or unsupported
browsers switch immediately. Articles, Works, and Archive use a single page title without catalog
eyebrow or explanatory lead copy. Route transitions snapshot `main` only: the outgoing page
completes its exit before the incoming page begins, while persistent Header and environment layers
remain static.

Article cards left-align category, date, title, summary, and tags in both Grid and List. Article
detail metadata vertically stacks category, published date, optional updated date, and localized
status. Its compact H1 retains the editorial serif role, while prose H2/H3 use the sans role; H2 is
one scale smaller with a lower divider, and the first H2 has no extra top space. Editorial
quotations remain close to body scale with compact padding and line height. Fenced code always uses
the dark code surface and its matching highlighted-token palette in both site themes. Its copy
action is an icon-only square aligned to either the title bar or top-right and temporarily becomes a
check icon.

Link cards require only `href` in authored content. `ReadingSurface` resolves title, description,
site, and optional repository-local OGP WebP from the generated preview registry; explicit component
props remain optional overrides for fixtures and stories. Their responsive minimum block size keeps
the clamped title, description, and site label visible under text enlargement; no arrow is shown.
Mermaid retains its source and rerenders every diagram on light/dark changes, with source fallback
after a render failure. Mobile table-of-contents disclosure animates height and opacity in both
directions in Full motion and becomes immediate in Reduced/Off; without JavaScript it remains a
native `details`. Desktop TOC uses one connected 1px vertical track and a 2px active segment that
slides to the current heading in Full motion and snaps in Reduced/Off. It shares the prose heading
anchor offset with scrollspy.

All routes use one visible fixed sprayed-noise image that multiplies in Light and screens in Dark.
It sits above weather ambience but below `main`, so opaque content surfaces reliably mask it while
transparent page regions retain the texture. Full motion shifts the tile at a low step frequency;
Reduced/Off and save-data keep it static, while print and forced colors remove it. Article-detail
routes always use the static Reduced noise state. Catalog search fields and facets, annotations,
code blocks, Mermaid surfaces, and link cards use opaque semantic theme colors so texture never
impairs controls or technical content. Home keeps one stable linear fallback behind WebGL and never
shows condition-specific radial blobs during startup. The Home profile anchor uses a serif “View
profile” label with a thicker indicator on its left. An optional transparent foliage composition may
grow and breathe from the upper edge only when an owned `config.visualAssets.heroOrganic` asset is
supplied; the site never synthesizes leaves while that authored slot is empty. Article tags combine
their semantic icon with a square filled label; 更新履歴 and 関連記事 share compact ruled-list
headings and vertically aligned dates. Reading surfaces remain transparent. Reaction controls omit
introductory copy and use only compact icon, label, count, and selection state. Public status labels
are 公開済み, 更新中, 断片, and 旧版 while their stored enum values remain unchanged. Work details
are image-led and left-aligned: Role, Period, and Field form a vertical definition list,
technologies use semantic icons, and configured GitHub/site URLs appear as View source and Visit
site actions.

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
