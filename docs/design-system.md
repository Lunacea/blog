# Design system

Status: Accepted

The design system is owned by `packages/ui`. Its implementation follows the package instructions in
`packages/ui/AGENTS.md` and the nested motion and visual instructions.

## Foundations

`packages/ui/src/foundations/theme.css` is the only source of reusable design values. It defines
semantic color, typography, spacing, layout, shape, depth, motion, breakpoint, and stacking tokens.
`global.css` owns selectors, resets, scrollbars, forced-color behavior, and browser fallbacks, and
must consume those tokens rather than define a second scale.

Tailwind CSS 4のCSS-first構成を使用し、JavaScriptの`tailwind.config`は持たない。Svelteファイルの
`<style>`は0件を契約とし、通常の見た目はutility class、状態は`data-*`・group・peer・custom variant、
所有できる複雑な子孫はarbitrary variantで表現する。CSSへ残すのは`@theme`、`@custom-variant`、
`@utility`、reset、print/forced-colors、SVX/Mermaid等の生成DOM、View
Transition、keyframesだけである。 再利用するanimationは`--animate-*`と`animate-*`を組にする。inline
styleは生成されたaspect ratio、 utilityへ渡すCSS custom
property、`view-transition-name`だけを許可する。

The light and dark themes retain the same semantic roles. System preference is used when the stored
preference is `auto`. Manrope followed by Zen Kaku Gothic New is the sans role. Newsreader followed
by Zen Old Mincho Medium is reserved for large editorial headings and quotations. DotGothic16
remains limited to named accents. Fira Code followed by system monospace is limited to fenced/inline
code, keyboard input, and technical identifiers. Dates, navigation, tags, and ordinary status text
use the sans role with tabular numerals where alignment is useful. The global weight scale is
intentionally one step heavier than the font defaults: ordinary text is 500, component and editorial
emphasis is 700, and strong labels use 800 where the selected face supports it. Faces capped below a
requested value use their heaviest authored weight.

These fonts are self-hosted from repository-pinned OFL sources. The build derives hashed WOFF2
subsets from public content, UI strings, and configuration, emits the same generated CSS for Web and
Storybook, and never contacts Google Fonts at runtime. Only the variable sans Latin face and medium
sans Japanese face needed for first paint are preloaded; the preload budget is 350 KiB and the total
initial-route custom-font budget is 500 KiB.

## Components and behavior

Low-level controls live in `primitives` and use Bits UI or local shadcn-svelte source when focus,
selection, disclosure, or ARIA behavior is non-trivial. Native controls remain preferred when they
provide the required behavior and progressive enhancement, including the GET search form.

Application routes consume the package's public exports rather than Bits UI or icon libraries
directly. Semantic components may depend on public schemas and configuration but do not own external
repositories.

Button/ActionLink、Input、Badge、Separatorは共通variant基盤でcontrol height、角形、罫線、focus、
active、disabled、文字組みを共有する。catalogのtext/icon切替は`LinkSelector`へ統合する。
`CatalogControls`と`ContentDetailView`はpatterns、`ResponsivePicture`、controlled
`ReactionControl`、`ShareActions`はcomponentsが所有する。リアクションのfetch/Zod検証と生成画像registry
解決はWeb adapterに残し、UI componentはnetworkへ直接依存しない。

Spatial composition uses the public `Container`, `Section`, `Stack`, `Cluster`, `Grid`, `Split`, and
`Bleed` primitives. They add layout only; spacing and responsive values resolve to foundation
tokens.

Editorial SVX compilation is shared by Web and Storybook through the UI-owned mdsvex configuration.
`ReadingSurface` owns prose composition, table of contents, code copying, and lazy Mermaid
rendering. Inline and display math are converted to KaTeX HTML at build time without a client math
runtime.

## Icons and authored media

UI icons resolve through `icons/Icon.svelte`. General UI uses Solar linear; official technology and
service marks use Simple Icons. The site's own glyphs - Display motion, Theme, Search, the contents
index, the paper mark, the praise heart and the scroll indicator - are drawn locally in one stroke
language instead: a 24 unit box, a 1.75 non-scaling stroke, round caps and joins, and one short
state transition. `icons/glyph.ts` holds that contract. Semantic resolvers cover interface actions,
weather state, and tags; unknown tags use the common tag icon. Icon data is bundled so the server
renders SVG without a browser request to an icon service.

Authored organic imagery is supplied through `config.visualAssets` and `MediaSlot`. Missing assets
use `AssetPlaceholder` with a stable ID, role, aspect ratio, file type, accessibility description,
and transparency need.

## Motion and resilience

Motion clarifies state and hierarchy. The effective motion mode never exceeds OS reduced-motion,
save-data, or forced-colors constraints. Eligible route changes animate only the `main` content with
restrained opacity and at most 6px translation. Fixed Header and other persistent chrome remain
stationary. Shared continuity is limited to matching content titles and Article media. Transitions
preserve navigation, focus, scroll restoration, and no-JavaScript access. Smooth scrolling is
enabled for a user-clicked same-document anchor and the bounded Home two-section snap assist;
Reduced/Off uses immediate movement. The custom cursor is available for fine, hovering pointers in
Full and explicitly selected Reduced modes, but capability-limited Reduced and Off retain the native
cursor. It never replaces native input/selection behavior.

The tab's first Full-motion Home visit may use a non-blocking 1.8-second opening sequence: a serif
word and single rule, the ambient visual and available point field, the title, then remaining chrome
and intro controls. A session flag prevents replay on reload, history restoration, and later Home
visits. The sequence never waits for WebGL and is absent for Reduced/Off, save-data, forced colors,
and no JavaScript. Shared reveal targets receive at most 240ms of stagger; only in-view media may
use scroll-linked translation, capped at 8px on mobile and 16px on desktop. Text and controls do not
parallax, and all scroll-linked work pauses outside the viewport or in a hidden tab.

The Header is a transparent fixed control layer rather than a horizontal bar. Its upper-right region
uses fixed columns for Theme, Display, a seven-rem navigation slot, and Search on the catalog route
only - Home and the reading surface keep three columns. Search is one icon button whose disclosure
holds the site-wide GET form for `/articles`; it shares the Header disclosure channel with the menu,
closes on Escape and returns focus to its button, and is replaced by a static expanded form when
JavaScript is unavailable. Desktop places Home, Articles inside that slot; compact and mobile states
replace the same slot with a seven-rem hamburger and matching menu panel. Theme and Display remain
immediately to its left, so resize and the Article reading boundary do not move their control boxes.
Every Home corner label, navigation row, Theme button, Display button, and hamburger uses the shared
control-size block height, so their baselines and hit areas remain stable across breakpoints. It has
no background, decorative border, shadow, blur, or radius. Feed and sitemap endpoints do not appear
in Header navigation. Display is one icon button that cycles Full, Reduced, and Off. Its Japanese
accessible name states the current and next mode, and a small Japanese tooltip beneath it names the
current mode on hover or focus rather than relying on a native title. Its glyph is a straight line
for Off, one wave for Reduced, and two waves for Full. Both paths share one point-symmetric sine
curve with one crest and one trough; switching mode interpolates amplitude and position. Full and an
explicitly selected Reduced mode advance one seamless phase on hover, while Off and
capability-limited reduced motion remain static. Theme controls remain transparent in both themes
and communicate state through the sun/moon glyph, color, and accessible name; the title glyph keeps
the accent color through hover and focus. The mobile navigation disclosure uses compact stacked text
with a short enter/exit transition. Selected navigation, filter, view, and reaction states use
rectangular semantic-color fills instead of underline markers. Non-Home pages reserve the fixed
control region before first paint: desktop content uses a shared inline-end reserve and aligns its
top edge with the navigation, while mobile retains only the three-button top clearance. On Article
detail, reaching the reading surface fades the desktop links into the same Theme, Display, and
hamburger controls used on mobile; returning above the surface restores them. Glass treatment may
appear on temporary interactive surfaces such as an open menu, mobile table of contents, or hover
media overlay, but not as a permanent Header, catalog filter, or reading-surface background. The
site has no global Footer. Header navigation and Display may use a clipped rectangular fill sweep
without moving their control boxes; navigation rows keep the same full width for hover and active
fills. Theme is excluded from that sweep and changes only to the title's accent color on
hover/focus. Theme and Display remain on the same vertical baseline. The filled hamburger moves its
two parallel lines slightly while closed; its open cross stays centered and rotates 90 degrees in
place on hover/focus. Reduced/Off applies state immediately. The custom pointer is a rotating heavy
square outline rather than a circular ring. Unlabelled actionable targets settle as an unfilled
diamond. Labelled targets first settle at a right angle, then extend horizontally; Article-list
“View more” keeps that rectangle fixed while one wide diagonal band in the same opaque accent as
Theme hover and linked Article-tag hover travels through it on an exact repeating tile. In Dark, the
label becomes black only where that band crosses it. Fine-pointer cursor labels identify the whole
draggable profile card, Article-list links, external previews, and code-copy actions as “Drag it!”,
“Read more”, “View more”, “Open external”, and “Copy code” respectively; native cursors remain in
all capability fallbacks. The profile card is a compact 18–22rem identity surface containing only
the authored profile asset, name, two short roles on separate lines, and vertical GitHub/X/Email
links. At rest in Full motion it retains a subtle authored tilt instead of settling horizontally.
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

WebGL remains an optional enhancement loaded dynamically after capability checks. Home owns the only
renderer. Static weather ambience, primary text, and navigation exist before it loads and remain
when it fails; no unrelated central substitute geometry is shown. The Canvas renders the independent
central Hero; weather stays in a persistent lightweight layer. The Hero still morphs equal-size
deterministic point sets through a Möbius strip, a sphere/point cloud, and a regular octahedron.
Fine-pointer proximity repels a compact local radius around nearby points in screen space and eases
back after pointer exit. Point sprites use small soft diamonds rather than circular droplet shapes.
Low quality uses at most 1400 Hero points and DPR 1.2; high quality uses at most 3200 Hero points
and DPR 1.5. Other routes use an SVG/CSS weather backdrop. Reduced motion, save-data, forced colors,
and Display Off hide the Home central motif rather than substituting unrelated geometry. The Home
visual layer is full-bleed across the Hero and About continuum while prose keeps its content width.
Scroll never owns or pauses the WebGL timeline; pointer drag may only change the Hero observation
angle while preserving vertical touch scrolling.

Weather keeps the same rendering surface from its first resolved condition; loading Home WebGL never
replaces it. Rain uses a transparent Canvas 2D particle field, not shaded water-bead SVGs. The
initial volume is populated before paint. Independent depth, velocity, wind and finite-exposure
streaks produce falling rain; only offscreen particles respawn. Three small cached streak textures,
a 320-particle ceiling and DPR cap of 1.5 bound the renderer's work. Reduced/Off and save-data keep
a static frame, hidden tabs stop animation, forced colors clears/hides the surface, and unmount
cancels its frame and listeners. No Three.js graph is added to content routes. Clear, Cloudy, and
Snow retain the persistent SVG/CSS layer. Snow falls with independent speed, soft focus and sway; it
never sticks to the pane. Rain and snow use a fixed, pointer-transparent viewport layer above
content but below dialogs; opening and scroll never move it. Unknown or unavailable weather renders
no weather decoration. Prerendered HTML does not claim live weather: the optional layer appears when
the fixed-location request resolves without delaying content. Development may preview `clear`,
`cloudy`, `rain`, `snow`, or `neutral` through `?weather=`; production ignores that override.

Article list views use compact ruled rows. Category classification is a permanent strip under the
folio in both views; tag, sort, reset and result count remain list-only, and every one of them stays
an ordinary GET link. Search is a Header control rather than catalog furniture. Newspaper/list uses
visible text labels. Mobile facets start collapsed after enhancement and stay available without
JavaScript. Full motion uses item-level View Transitions when only `view` changes; Reduced/Off
switches immediately. Route transitions snapshot `main` only, leaving persistent chrome static.

Article cards left-align category, date, and title in both Grid and List. The newspaper lead adds
its summary and up to three representative tags; column and boxed records keep the summary without
tag chrome, and every record ends with its reading length. Article detail metadata vertically stacks
category, published date, optional updated date, and localized status. Its compact H1 retains the
editorial serif role, while prose H2/H3 use the sans role; H2 is one scale smaller with a lower
divider, and the first H2 has no extra top space. Editorial quotations remain close to body scale
with compact padding and line height. Fenced code always uses the dark code surface and its matching
highlighted-token palette in both site themes. Its copy action is an icon-only square aligned to
either the title bar or top-right and temporarily becomes a check icon.

Link cards require only `href` in authored content. `ReadingSurface` resolves title, description,
site, and optional repository-local OGP WebP from the generated preview registry; explicit component
props remain optional overrides for fixtures and stories. Their responsive minimum block size keeps
the clamped title, description, and site label visible under text enlargement; no arrow is shown.
Mermaid retains its source and rerenders every diagram on light/dark changes, with source fallback
after a render failure. Reduced/Off explicitly remove animation and transition from the generated
Mermaid SVG tree. Mermaid's temporary measurement tree is exempt from the global duration override
so its generated viewBox and compact geometry match Full mode. The mobile table of contents is a
compact filled control on the Header line at the top left, no wider than its label. It shares the
Header disclosure channel, opens a downward panel on the navigation menu's surface, closes on Escape
or on choosing a heading, and its glyph collapses three index rules into one; without JavaScript it
remains a native `details` in the document flow. Desktop and mobile both use one connected 1px
vertical track and a 2px active segment, in the colour of the active label, that slides to the
current heading in Full motion and snaps in Reduced/Off. It shares the prose heading anchor offset
with scrollspy.

All routes use one visible fixed sprayed-noise image that multiplies in Light and screens in Dark.
It sits above weather ambience but below `main`, so opaque content surfaces reliably mask it while
transparent page regions retain the texture. Full motion shifts the tile at a low step frequency;
Reduced/Off and save-data keep it static, while print and forced colors remove it. Article-detail
routes always use the static Reduced noise state. Catalog search fields and facets, annotations,
code blocks, Mermaid surfaces, and link cards use opaque semantic theme colors. Article catalog and
detail typography use a tight theme-colored glyph shadow that masks texture only immediately behind
the letters, without turning the surrounding layout into an opaque block. Home keeps one stable
linear fallback behind WebGL and never shows condition-specific radial blobs during startup. The
Home profile anchor uses a serif “View profile” label with a thicker indicator on its left. An
optional transparent foliage composition may grow and breathe from the upper edge only when an owned
`config.visualAssets.heroOrganic` asset is supplied; the site never synthesizes leaves while that
authored slot is empty. Article tags combine their semantic icon with a square filled label;
更新履歴 and 関連記事 share compact ruled-list headings and vertically aligned dates. Article TOC
labels use the small UI scale rather than caption text, and the optional cursor becomes a vertical
caret over Article prose by visibly settling and collapsing the existing rotating square. Reactions
close the article as one centred post-reading block: an unboxed heart glyph, its count, and the
share link beneath. The count answers the press immediately and reconciles with the server, and
selection fills the heart itself. Selecting plays a one-shot celebration - that same heart blooming
across the viewport behind a handwritten `Thank you!` that draws itself once - which exists in the
DOM only while it runs and only in Full motion. The X icon with a visible Share label uses a plain
intent link without third-party scripts. Public status labels are 公開済み, 更新中, 断片, and 旧版
while their stored enum values remain unchanged.

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

## Newspaper and paper (2026-09)

Articles opens on a newspaper front page with no display title: a folio line carries the small
`Articles` heading, the discipline line, the record count and the newest date, and a permanent
category strip sits directly beneath it. The front section pairs a serif lead story with one
secondary record across a vertical rule; the remaining records follow under a section rule in three
desktop columns, two tablet columns and one mobile column, separated by column rules that never open
a row. Between them, a boxed serendipity feature re-surfaces older records chosen once per UTC day;
its picks leave the ordinary grid, so no record prints twice. Editorial serif headings, rules,
summaries and authored covers establish hierarchy.

Paper surfaces use semantic paper color, thin rules and restrained shadow. The existing sprayed
background remains visible around opaque surfaces. Every record carries its reading length as a
figure and a small stacked paper mark rather than a bar under the row: one sheet stands for one
reading minute, clamped to 1–5, and the front sheet's bottom-right corner is folded. Fine-pointer
hover and keyboard focus widen that fold without moving text; Reduced/Off and coarse pointers keep
it at rest. Forced colors removes shadows. The business card uses the same paper surface with its
existing identity asset and optional drag.

Desktop TOC has a decorative vertical minimap: short lines represent prose, accent-colored
rectangles represent technical and media blocks in source order. Existing TOC links and active
marker own navigation; section sizing resolves by heading ID. Mobile retains its normal collapsible
TOC. Missing composition data never prevents reading or navigation.

Home keeps Hero and ambience. The intro section keeps its three rows with the title centred and the
profile anchor at its foot; it carries no role line. The profile group is vertically and
horizontally centered in its viewport-height section, expanding for small screens or enlarged text.
It contains a paper card, one concise description of UI/UX, Web engineering and graphic design, a
light row of representative stack names with their icons, and an Articles link.
