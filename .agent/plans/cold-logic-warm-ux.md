# LUNACEA — Cold Logic, Warm UX

## Goal and boundaries

Replace Home, the article catalog and the shared typographic system with a monochrome editorial
composition led by oversized type, a single coloured theme control, optional WebGL light and a
site-wide footer. Preserve URLs, content schemas, GET search, API/KV privacy, prerender/SSR
boundaries and the existing font and JS budgets. No deployment or Git publication.

## Decisions taken with the client

1. Typeface: Archivo (variable weight 100–900, width 62–125) for the whole system; Instrument Serif
   as a Latin-only decorative accent; Zen Kaku Gothic New for Japanese. Newsreader, Zen Old Mincho,
   Manrope and DotGothic16 were dropped from the bundle.
2. Header: Home carries none — the masthead is the identity. Every other route gets one hairline
   sticky bar.
3. WebGL: a full-bleed field of light, shadow and grain rather than a text effect.
4. Catalog: one continuous numbered index with a sticky category rail.
5. Opening: the grain clears and the masthead sharpens; content is never gated.

Client revisions after the first review: the original sun/moon glyph is reused at masthead scale and
is the only coloured element (the previous gold accent); the masthead bleeds symmetrically; the Home
folio bar and the on-screen concept line are removed; the introduction becomes a business card at
the printed 91×55 proportion with icon contacts; the catalog label is dropped and categories are
left-aligned; secondary text is darkened; a footer carries contact, copyright and the motion
control.

## Milestones and acceptance

1. Fonts and tokens: Archivo/Instrument Serif subsets carry both variable axes; the type scale
   supports a masthead that bleeds and folio labels that do not.
2. Home: masthead, theme control, business card, category navigation and the numbered index work at
   390/768/1440px, in both themes, with motion ON and OFF, and with enlarged text.
3. Catalog: category rail, numbered index, and a closing search/tag/sort panel; GET filtering only.
4. Light: static SVG light and grain on every route; Home layers the dynamically imported WebGL
   field and disposes it on Off, offscreen, hidden and failure.
5. OG: every article renders LUNACEA, its category and its title in the shared 1200×630 template.
6. Validation: Svelte check, design check, unit tests, build, budgets and the E2E suite.

## Validation commands

- `deno task --cwd apps/web check`
- `deno task design:check`
- `deno task test:unit`
- `deno task build`
- `deno task budget:check`
- `deno task test:e2e`

## Progress

- Fonts downloaded from the pinned Google Fonts repository into `packages/ui/fonts/source`; the
  generator now emits `font-style` and `font-stretch`. Verified the Archivo subset keeps both the
  `wght` and `wdth` axes. Newsreader, Zen Old Mincho, Manrope and DotGothic16 were dropped.
- Home, the catalog, the reading surface, the header, the footer, the OG template and the light
  field were rebuilt, then revised across several client reviews: the sun and moon returned to the
  original glyph in monochrome, the masthead bleeds symmetrically, the introduction became a tilted
  business card with the author's portrait, the catalog folded its rail on small screens, the
  minimap was projected onto its real heading rows and cut at section boundaries, praise became a
  liquid squash under a short invitation, and the weather now reads as four distinct exposures.
- Two systemic defects were found and fixed along the way: Tailwind 4 writes `rotate`, `scale` and
  `translate` as independent properties, so `transition-transform` animated nothing; and a change to
  a registered custom property does not reliably invalidate a long `color: inherit` chain, which
  left index rows and the profile card painted in the previous theme's ink.
- Validation: `check` 0 errors / 0 warnings, `design:check` passing, `lint` and `fmt:check` clean,
  `test:unit` 21/21, `build` succeeding, `budget:check` at 110.6 KiB gzip for the article initial
  graph (limit 150) and 127.3 KiB for the WebGL graph (limit 230), and the full E2E suite at 69
  passed / 0 failed across desktop, mobile and no-JavaScript projects.
- Later client rounds: the business card became draggable with a spring back to its resting tilt;
  the opening is now carried by the masthead's ink displacement alone, declared before the first
  paint so it runs with the page instead of replaying after hydration, with no grain sweep and no
  doubled card tilt; the footer address warps only inside a small lens that follows the pointer and
  not at all with motion off; and page transitions dissolve the `root` snapshot rather than naming
  `main`, which had dragged the outgoing page down the viewport when leaving a scrolled Home.
- Not done: a custom cursor. It was removed as part of this redesign and reintroducing it would add
  a JavaScript-driven layer to every page for no reading benefit; raised with the client instead.

## Risks and rollback

WebGL and font alignment need browser verification, which was done by screenshot at 390/1440 in both
themes. Raster OG needs Japanese glyph checks, also done by rendering. The static SVG light is the
fallback for every failure path. Reverting the scoped redesign restores the previous presentation
without data migration. The legacy `reduced` motion preference still maps to OFF without changing
its storage key.
