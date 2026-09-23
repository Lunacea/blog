# Design system

Status: Accepted

The reusable foundation is owned by `packages/ui`; site-specific composition is owned by `apps/web`.
The package contract follows `packages/ui/AGENTS.md`.

## Foundations

`packages/ui/src/styles/tokens.css` is the source of reusable scales and semantic roles. It defines
color, typography, spacing, layout, shape, depth, motion, breakpoints, and stacking. `base.css` owns
reset, focus, reduced-motion, forced-color behavior, and browser fallbacks; `utilities.css` contains
only the shared `pressable` and `ink-underline` behaviors. Site tokens live in
`apps/web/src/styles/tokens.css` and may not add a second common scale.

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
`font-stretch-*` utilities address the width axis. Fira Code followed by system monospace is limited
to fenced/inline code, keyboard input, and technical identifiers. Dates, navigation, tags, and
ordinary status text use the sans role with tabular numerals where alignment is useful. Interface
text is 550, article reading copy is a lighter 400, component and editorial emphasis is 700, and
strong labels use 800 where the selected face supports it. Archivo is variable, so it renders each
of those literally. Zen Kaku Gothic New is not: it has only Regular and Bold, and with nothing
authored between them 400 lands on Regular while 550, 700 and 800 all land on Bold. The interface
weight is therefore chosen above 500 deliberately — it keeps ordinary Japanese text on the same face
the headings already need. Faces capped below a requested value use their heaviest authored weight.

The hairline bar is sticky, so `scroll-padding-top` on the root reserves its height and every anchor
lands clear of it.

Weather is read from Open-Meteo for one fixed location and shown as light, never as a forecast. A
reported shower or snowfall is always shown as it is. A clear or clouded sky occasionally turns over
instead: cloud breaks to clear, or a passing shower crosses it. A passing shower keeps the sky's
frame and exposure and thins only the weather in it, every part of it by the same share, so it
covers the same ground without reading as either overcast or a settled fall. How often that happens
follows the location's own monthly rates, so summer showers and winter flurries are common and the
reverse never occurs; it is rarer over a clear sky than over cloud. The choice is a hash of a
twenty-minute bucket, so a shower holds still and then passes. In dev, `?weather=` and `?intensity=`
on Home or Articles force either.

The palette is monochrome throughout, including the theme control. The only colour on the site comes
from the author's own identity artwork on the profile card.

The foundation carries only what the site renders; an unused primitive, icon, token, or utility is
removed with its tests and story. Storybook documents both foundation and Web features, and
`storybook:check` holds them to the accessibility sweep and the 200% text rule.

These fonts are self-hosted from repository-pinned OFL sources. The build derives hashed WOFF2
subsets from public content, UI strings, and configuration, emits the same generated CSS for Web and
Storybook, and never contacts Google Fonts at runtime. Only the variable sans Latin face and the
bold sans Japanese face needed for first paint are preloaded; the preload budget is 350 KiB and the
total initial-route custom-font budget is 500 KiB. Article routes additionally fetch the regular
Japanese face their reading copy is set in; no other route needs it.

## Components and behavior

Low-level controls live in `primitives` and use Bits UI or local shadcn-svelte source when focus,
selection, disclosure, or ARIA behavior is non-trivial. Native controls remain preferred when they
provide the required behavior and progressive enhancement, including the GET search form.

Application routes consume only `@lunacea/ui/primitives`, `icons`, `utils`, `fonts`, and
`styles.css`. The package has no root export or unrestricted deep import. `Input`, `Badge`,
`Separator`, `Collapsible`, and the existing action variants are the complete primitive layer; a new
Button hierarchy or general variant framework is added only when repeated use establishes a clear
API.

Feature components live under `apps/web/src/lib/articles`, `home`, `shell`, `preferences`,
`navigation`, and `visuals`. Web has no feature barrel: routes and features import concrete files.
`ReactionControl`, `ShareActions`, `ResponsiveImage`, and `ContentDetail` therefore remain close to
their schemas, network adapter, generated image registry, and route behavior without pushing those
dependencies into UI.

Editorial SVX compilation is shared by Web and Storybook through `apps/web/mdsvex.config.js`.
`ReadingSurface` and `ReadingEnhancements` own prose composition, table of contents, code copying,
and lazy Mermaid rendering. Inline and display math are converted to KaTeX HTML at build time
without a client math runtime.

## Icons and authored media

UI icons resolve through `icons/Icon.svelte`. General UI uses Solar linear; official technology and
service marks use Simple Icons. The site's own glyphs - Display motion, Theme, Search, the contents
index, the disclosure sign, the paper mark, the praise heart and the scroll indicator - are drawn
locally in one stroke language instead: a 24 unit box, a 1.75 non-scaling stroke, round caps and
joins, and one short state transition. `icons/glyph.ts` holds that contract. Semantic resolvers
cover interface actions, weather state, and tags; unknown tags use the common tag icon. Icon data is
bundled so the server renders SVG without a browser request to an icon service.

Authored organic imagery is supplied by Web through `config.visualAssets`; the UI foundation does
not own site media or placeholders.

## Motion and resilience

Cold Logic, Warm UX uses near-white paper, near-black ink and grayscale interaction states, with a
muted vintage red reserved for the praise control. Shared semantic tokens retain their roles in both
themes. Archivo sets the oversized masthead and every label. Article reading copy is set in Zen Kaku
Gothic New for Latin as well as Japanese, so a Latin word inside a sentence keeps the weight of the
kana around it; headings and the interface keep Archivo. It is 17–18px equivalent (16px on a phone,
a step lighter than the interface around it), line-height 1.9, tracked open 0.03em, paragraphs
separated by a full space step, and held to a maximum width of 38em — about 37 full-width characters
a line. The tracking is reading copy only: monospace is set on a grid and diagrams to their own
metrics, so both reset it. Inline code is set at 0.9em on a faint tint with room on either side, so
a run of it reads as an object in the sentence rather than a change of font. Code highlighting may
retain semantic syntax colors. Text colour is never animated; state is carried by rules, position,
width axis and reveal instead.

Home carries no header. The masthead is the identity: LUNACEA is set at 20.4vw so it bleeds past
both gutters, centred by a flex container inside `overflow-x-clip` so the overflow is symmetric and
the document never scrolls sideways. The C is replaced by the theme control at
`--masthead-disc-size`, which draws the shared sun and moon glyph at display scale in the accent
gold. Below it sit a business-card introduction at the printed 91×55 proportion (slightly narrower
on phones), six latest articles in the shared numbered index, and a full-index link. Every other
route gets one hairline sticky bar holding the wordmark, two navigation links and the theme control.
A site-wide footer closes every page with a contact block, social marks, the copyright line and the
motion control. There is no fullscreen noise, glass profile, point-cloud centerpiece, custom cursor,
scroll snap or mobile menu disclosure.

Hover and selection underlines are one behavior across the site. The `ink-underline` utility draws a
hairline that grows from the left on hover or focus and stays drawn while the element carries
`aria-current`; the bar's navigation, the catalog's category rail, its sort control, the tag lists
and the category folio all share it, so nothing fades a color where something else draws a rule.
Where a row carries a count as well as a label, the rule runs the whole row and ends at the number,
so a two-letter category still gets a rule long enough to read. Its distance from the text never
changes, because it is placed from the centre of the line rather than from the edge of the box. It
is revealed by its width and not by a transform, against the usual preference for transform and
opacity: a hairline handed to the compositor changes weight when the layer is handed back at the
end, and the line has to look the same while it is drawing as it does once drawn. Selection is
carried by the rule and by ink against quiet, never by a change of weight that would move the line.

Motion is ON/OFF and is switched from the footer. Existing full means ON and reduced/off mean OFF.
OS reduced motion, forced colors and save-data force static rendering. The motion system has four
curves: `--ease-standard` for state, `--ease-enter` for arrivals, `--ease-spring`, which overshoots,
for objects that should feel physical — the lunar disc, the card, buttons and the row rules — and
`--ease-response`, paired with a 120ms duration, for a control that has to answer the finger: it is
53% done a tenth of the way in, where the signature curve is 0.8%, so the result is there before the
motion is. The catalog disclosure and its plus-minus sign are on it. A hover is not a press: the
clear chip fades its fill over the micro step on the standard curve, because a fill that arrives in
the first twelve milliseconds is not seen to arrive at all. `pressable` takes `--press-duration` and
`--press-ease` to switch any control over. The first eligible Home visit per tab clears the grain
over roughly 1.2 seconds while the masthead sharpens from blur to its resting tracking, the disc
swings in and the card settles into its tilt, each on its own delay so the sequence has a rhythm;
content is visible and navigable from the first frame and there is no loading overlay. HTML remains
the finished design when motion is absent. Shared glyphs keep their stroke contract, state feedback
and accessible names. Theme changes are immediate when motion is disabled.

`StaticLight` draws the site's light and grain in SVG with no JavaScript. Home, the article catalog,
and article details layer a dynamically imported Three.js field between the light and the grain: one
soft key light that follows a fine pointer, drifting cloud cover, and per-pixel grain. The renderer
pauses offscreen and in hidden tabs and is disposed on unmount, Off or failure; the static
composition underneath is the fallback in every case. Article initial dependencies exclude this
graph.

Weather is fetched on Home, the article catalog, and article details, which render it through their
shared static field. The article's paper-colored reading surface covers the field, leaving it
visible around the header, revisions, and related records. It is expressed solely as light. Clear
opens the key light into daylight; cloudy lays a flat veil that reads darker on paper; rain closes
the light down into shade; snow lifts the whole field into a bright, low-contrast whiteout. The
static fallback tells the same four stories, using a light wash rather than a dark one for snow.
There are no falling particles, weather labels or location UI. Unavailable weather remains neutral;
static weather shading works with motion Off.

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

Home, the article catalog, and article details mount the animated field. The article's opaque paper
keeps the fixed gradient out of running text. The static gradient is an even vignette rather than a
spotlight, and it steps back once the animated field is running. `opacity` takes no `light-dark()`,
so the field's light and dark values are set per theme instead. On paper a white highlight is
invisible, so light mode reads the pointer as a clearing in a lightly shaded field; in the dark the
same field is held back so it never swallows secondary text. Where no pointer hovers, the light
drifts along an uneven figure instead of standing still, and a fine pointer takes it back the moment
it moves. On touch devices scrolling carries the light down the page; once reading pauses the same
drift grows back in over a few seconds. While nothing guides the light, irregular soft events come
and go on their own and never start while the reader is interacting. They follow the weather: clear
skies mostly open the key light; cloud either sends a shadow of varying size across the field or
thins to let dappled light through a gap; rain drops a single ripple on the water; snow carries a
pale drift of powder across on the wind. Overcast skies move in two layers at different speeds so
the cover never slides as one sheet. Events are drawn with the field's own noise and shading, never
as particles or points.

The animated field also follows the configured location's sky. The sun's elevation and bearing are
computed in the browser from the location and the current time; low sun warms the light and brings
it in from the east in the morning and the west in the evening, cloud mutes that warmth, and night
cools the light and closes the direct sun. The static composition does not change with the hour.

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

Storybook is hosted in `apps/web` and imports the same `src/styles/app.css` used by Web. Its toolbar
exposes the semantic theme, effective motion request, and project viewport presets without defining
a second token system. Stories are grouped as UI, Articles, Home, Shell, and Visuals. The editorial
story uses a non-public SVX fixture that exercises headings and TOC, annotation, quote, highlighted
code, Mermaid, and KaTeX.

`deno task storybook:check` builds Storybook and validates every story for runtime errors, axe
violations, horizontal overflow at narrow mobile, tablet, desktop, and wide desktop widths, and 200%
text at narrow and tablet widths. It also checks editorial output, page transitions, header keyboard
operation, motion, and the static fallback when WebGL cannot start.

## Catalog and reading surfaces (2026-09)

Articles opens with a modest ARTICLES heading. A sticky rail on the right owns the filter: All plus
every category with its count. Below the rail's width the column order is the heading, the rail,
then the index, so the title is always read first. The records themselves are one index shared with
Home (`apps/web/src/lib/articles/IndexList.svelte`): date, title, tags and category on one row, the
date and category sitting on the title's first baseline so they hold still, plus a summary that
opens on hover or focus on desktop and is always open on small screens; the title and that summary
are given the width the row can spare, held at about forty-four full-width characters a line. On the
articles index the glass pane fades to transparent toward both outer edges, so it ends on no hard
edge beside the date or the category; the rule under the row comes up in place rather than
travelling. Sort is not a filter, so it does not join the filter line: it sits directly above the
index as that block's own control, its folio label set beside the three orders it switches. Filtered
results name what is filtering them — the query, the category and the tag — with the label set as a
folio and the values in ink, and close the line with the one control on the page that is a surface
rather than a word: a compact chip on the same glass as the All articles link, which fills with ink
under the pointer, so clearing is never mistaken for another choice. It clears the filters and
leaves the order alone. That line holds its place while nothing is filtering, so choosing a category
never drops the index by a step. The filter line, the sort and the index are each one step apart, so
the three read as one block and the eye is not asked which of them belongs to which. Below the
rail's width the rail's disclosure is the plus-minus sign on its own glass square rather than a
word. Every other control here is the same object: quiet text at control height, ink and a rule when
current, no box and no padding of its own. Search and tags close the page in a low-emphasis panel.
There is no oversized page title, view toggle, lead story, Pick Up box or ranking rail.

Desktop TOC has a decorative vertical minimap: short lines represent prose, accent-colored
rectangles represent technical and media blocks in source order. Existing TOC links and active
marker own navigation; section sizing resolves by heading ID. Mobile retains its normal collapsible
TOC. Missing composition data never prevents reading or navigation.

Article titles use the sans role at `--text-h2`; the serif accent never appears in a record.

Prose headings carry three different separations, one per level. `h2` is a tinted band the width of
the measure — background, never a rule — so a new section is a change of ground rather than a line
drawn across the column. `h3` carries the hairline rule. `h4` and below carry neither: the sans role
and the weight are the whole of the step down.

Code and diagram blocks share one shell (`apps/web/src/lib/articles/block-tools.ts`): a bar carrying
the block's own identity, a Preview/Source pair of tabs, Copy and — once the source has been changed
— Reset. The source view is an editable textarea; editing a diagram re-renders it after a pause in
the typing, and editing code shows the reader's own text in the preview rather than the highlighted
original. Both tabs stay in the tab order, and the whole shell is an enhancement: without it the
block still renders, still names itself through its CSS bar, and still reads correctly. Each frame
declares its own ink in `--block-ink`, so one set of controls serves the code palette and the page
surface.

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
