# WebGL Typography Follow-up ExecPlan

Status: Proposed after the portfolio redesign rollout

## Goal

Compare three Home-only renderings of the word “Lunacea”: font geometry, shader/point typography,
and HTML-only typography. The existing HTML heading remains the semantic source of truth in every
option.

## Constraints

- WebGL text is `aria-hidden` and never replaces the HTML heading.
- The static fallback is authored HTML typography using the design-system font roles.
- No font geometry or shader dependency may enter Article, Work, Archive, feed, OGP, or API graphs.
- The Home recursive dynamic WebGL graph must remain at or below 230 KiB gzip.
- Reduced motion, Save-Data, forced colors, low capability, context loss, and no JavaScript use the
  static fallback.

## Comparison work

1. Measure a subset font-geometry payload and its parse/main-thread cost.
2. Prototype point typography using the existing GPU interpolation material and measure added
   attributes/shader cost.
3. Compare both with HTML-only placement for legibility, overlap with the three-shape timeline, and
   320–1440 px layouts.
4. Review screenshots at full/reduced/off motion and 200% text.
5. Present measurements and a rollback boundary before selecting a production method.

No WebGL typography ships as part of the current redesign.
