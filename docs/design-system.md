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
preference is `auto`. Archivo followed by Zen Kaku Gothic New is the sans role and carries the whole
system, including every heading. Archivo is variable on both weight (100–900) and width (62–125%),
so the masthead is set wide and heavy while folio labels are set narrow and tracked;
`font-stretch-*` utilities address the width axis. Instrument Serif is a Latin-only decorative
accent and is never used for Japanese or for body text. Fira Code followed by system monospace is
limited to fenced/inline code, keyboard input, and technical identifiers. Dates, navigation, tags,
and ordinary status text use the sans role with tabular numerals where alignment is useful. The
global weight scale is intentionally one step heavier than the font defaults: ordinary text is 500,
component and editorial emphasis is 700, and strong labels use 800 where the selected face supports
it. Faces capped below a requested value use their heaviest authored weight.

The palette is monochrome throughout, including the theme control. The only colour on the site comes
from the author's own identity artwork on the profile card.

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

Cold Logic, Warm UX uses near-white paper, near-black ink and grayscale interaction states, with a
muted vintage red reserved for the praise control. Shared semantic tokens retain their roles in both
themes. Archivo sets the oversized masthead and every label; Instrument Serif provides Latin-only
decorative contrast. Japanese prose stays in Zen Kaku Gothic New, 17–18px equivalent (16px on a
phone, at the same weight as everywhere else), line-height 1.9 and a maximum width of 42em. Code
highlighting may retain semantic syntax colors. Text colour is never animated; state is carried by
rules, position, width axis and reveal instead.

Home carries no header. The masthead is the identity: LUNACEA is set at 20.4vw so it bleeds past
both gutters, centred by a flex container inside `overflow-x-clip` so the overflow is symmetric and
the document never scrolls sideways. The C is replaced by the theme control at
`--masthead-disc-size`, which draws the shared sun and moon glyph at display scale in the accent
gold. Below it sit a business-card introduction at the printed 91×55 proportion, a left-aligned
category navigation, six latest articles in the shared numbered index, and a full-index link. Every
other route gets one hairline sticky bar holding the wordmark, two navigation links and the theme
control. A site-wide footer closes every page with a contact block, social marks, the copyright line
and the motion control. There is no fullscreen noise, glass profile, point-cloud centerpiece, custom
cursor, scroll snap or mobile menu disclosure.

Motion is ON/OFF and is switched from the footer. Existing full means ON and reduced/off mean OFF.
OS reduced motion, forced colors and save-data force static rendering. The motion system has three
curves: `--ease-standard` for state, `--ease-enter` for arrivals and `--ease-spring`, which
overshoots, for objects that should feel physical — the lunar disc, the card, buttons and the row
rules. The first eligible Home visit per tab clears the grain over roughly 1.2 seconds while the
masthead sharpens from blur to its resting tracking, the disc swings in and the card settles into
its tilt, each on its own delay so the sequence has a rhythm; content is visible and navigable from
the first frame and there is no loading overlay. HTML remains the finished design when motion is
absent. Shared glyphs keep their stroke contract, state feedback and accessible names. Theme changes
are immediate when motion is disabled.

`StaticLight` draws the site's light, shadow and grain in SVG with no JavaScript, and every route
mounts it. Home layers a dynamically imported Three.js field between the light and the grain: one
soft key light that follows a fine pointer, drifting cloud cover, and per-pixel grain. The renderer
pauses offscreen and in hidden tabs and is disposed on unmount, Off or failure; the static
composition underneath is the fallback in every case. Article initial dependencies exclude this
graph.

Weather is fetched on Home and on the article catalog, and every route renders it through the shared
static field; reading routes inherit the last known condition rather than making a request. It is
expressed solely as light. Clear opens the key light into daylight; cloudy lays a flat veil that
reads darker on paper; rain closes the light down into shade; snow lifts the whole field into a
bright, low-contrast whiteout. The static fallback tells the same four stories, using a light wash
rather than a dark one for snow. There are no falling particles, weather labels or location UI.
Unavailable weather remains neutral; static weather shading works with motion Off. Article pages
have no weather decoration.

Tailwind 4 writes `rotate`, `scale` and `translate` as independent properties, so any transition
that animates them must name those properties: `transition-transform` silently does nothing. Every
hover in the system that moves or turns names the property it animates.

Reading routes put the table of contents in a sticky rail with the share actions pinned beneath it;
on small screens the disclosure joins the document flow at the top of the reading surface with no
band of its own. Table-of-contents rows take their natural height, so the active marker never
stutters at the last heading and the composition minimap is only ever as tall as the headings
already need; the minimap is projected through those measured rows, and each block is cut at the
section boundaries it crosses, so every heading shows its own content rather than one slab beside
the first of them. Share offers the generic action first — the platform share sheet, falling back to
copying the link — with a single X post beside it. Praise follows the article body under a short
invitation, ahead of the revisions and the related index, and the acknowledgement is a
squash-and-stretch of the heart itself; nothing covers the page. Code blocks that scroll sideways
are focusable regions so the keyboard can reach them at enlarged text.

Home and the article catalog both mount the animated field; reading routes keep the grain alone,
because a fixed gradient behind running text reads as a stray light source. The static gradient is
an even vignette rather than a spotlight, and it steps back once the animated field is running.
`opacity` takes no `light-dark()`, so the field's light and dark values are set per theme instead.
On paper a white highlight is invisible, so light mode reads the pointer as a clearing in a lightly
shaded field; in the dark the same field is held back so it never swallows secondary text. Where no
pointer hovers — every touch device — the light drifts along a slow, uneven figure instead of
standing still, and a fine pointer takes it back the moment it moves.

Hovering a row in the index slides a pane of liquid glass under it: a thin saturated fill over an
18px blur with a lit inset edge, behind the type and never touching it. It is dropped under forced
colours and in print.

Category and tag are deliberately different objects. A category is a section of the site and is set
as a folio marker — condensed, tracked, uppercase, and numbered in the catalog rail. A tag is a
keyword and keeps the small `#tag` form. GET search and tag filtering remain available but close the
catalog rather than open it, matching how often they are used. No-JavaScript access remains
complete.

All article OG images share a 1200×630 composition, always in the dark theme because a card is read
against someone else's timeline: LUNACEA in Archivo over a hairline rule, then the category in a
filled chip and the full title — set in the same stack the site uses, Archivo for Latin and Zen Kaku
Gothic New for Japanese, at the same strong weight and tracking as a title on the page itself —
centred together between the rules, and the site address and up to three tags closing the card. The
background carries the same three layers the site draws — a pool of cast light, the smoke that veils
it, always in the top right, and the vignette that closes the frame — held at one setting so a row
of cards reads as the same surface. Local font rendering measures and wraps glyphs; cover presence
does not change the design.

The site card is a different design entirely: it is Home. The masthead bleeds past both edges with
the moon standing in for the C, and the business card rests at its tilt while rising out of the
bottom edge, showing the half that carries the identity. It carries no tagline.

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

## Catalog and reading surfaces (2026-09)

Articles opens with a modest ARTICLES heading. A sticky rail owns the two ordering controls: All
plus every category with its count, and the sort order. The records themselves are one index shared
with Home (`patterns/IndexList`): date, title, tags and category on one vertically centred row, plus
a summary that opens on hover or focus on desktop and is always open on small screens. Nothing in a
row changes size on hover. Sort sits in the rail beneath the categories; search and tags close the
page in a low-emphasis panel. There is no oversized page title, view toggle, lead story, Pick Up box
or ranking rail.

Desktop TOC has a decorative vertical minimap: short lines represent prose, accent-colored
rectangles represent technical and media blocks in source order. Existing TOC links and active
marker own navigation; section sizing resolves by heading ID. Mobile retains its normal collapsible
TOC. Missing composition data never prevents reading or navigation.

Article titles use the sans role at `--text-h2`; the serif accent never appears in a record.

Code and diagram blocks share one shell (`patterns/block-tools`): a bar carrying the block's own
identity, a Preview/Source pair of tabs, Copy and — once the source has been changed — Reset. The
source view is an editable textarea; editing a diagram re-renders it after a pause in the typing,
and editing code shows the reader's own text in the preview rather than the highlighted original.
Both tabs stay in the tab order, and the whole shell is an enhancement: without it the block still
renders, still names itself through its CSS bar, and still reads correctly. Each frame declares its
own ink in `--block-ink`, so one set of controls serves the code palette and the page surface.

Every control answers a press through the `pressable` utility: it sinks `--press-shift` and gives
`--press-scale`, immediately on the way down and eased on the way back. Controls that already
animate a transform on hover declare their own `active:` step instead. Focus is one indicator
everywhere — a solid 2px ink ring at `--radius-small`, offset outward by 1px, and drawn inside the
control wherever it sits in something that clips or scrolls (the table of contents, the rail
disclosures, code and diagram blocks).

## Reading behavior retained

Link cards resolve authored hrefs through the generated local preview registry; no runtime external
metadata request is introduced. Mermaid retains source fallback and rerenders on theme changes. The
mobile TOC uses a native details fallback and shares the Header disclosure channel after
enhancement. Heading links, scrollspy, code copying, math, update history and related-article lists
remain available.

Reactions remain a centered post-reading heart, count and share link. Optimistic counts reconcile
with the existing server contract; the one-shot thank-you celebration only runs with full motion.
The X share action is a plain intent link. Public status labels and stored enums remain unchanged.

## Background rendering on mobile

The fixed background uses `h-lvh` so browser toolbar motion does not continually resize its surface.
ResizeObserver and scroll events only mark pending work; the renderer reads dimensions once and
resizes a changed drawing buffer immediately before rendering. Touch devices use at most DPR 1 and
three noise octaves; fine-pointer devices retain the existing DPR and five octaves. Grain is
spatially stable instead of being reseeded every frame. Theme, motion Off and failure behavior
remain unchanged. Route-owned weather loading/cancellation lives in `apps/web/src/lib/weather.ts`,
while `editorial-light.ts` owns GPU lifecycle/input and `editorial-light-material.ts` owns the
shader and weather palette. Both GPU modules stay behind the same dynamic import.

References: [Tailwind transforms](https://tailwindcss.com/docs/transform),
[viewport lengths](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Values/length),
[WebGL rendering budgets](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices).
