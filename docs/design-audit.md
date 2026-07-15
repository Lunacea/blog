# Design audit and reconstruction brief

Updated: 2026-07-14

This document is the pre-implementation checkpoint for the visual reconstruction. It describes the
static design before motion or decorative detail is added. The deployment model, content model,
routes, feeds, weather, search, and reactions remain unchanged.

## Current problems

- **Color roles are ambiguous.** Components refer to visual names such as `green-deep`, `moss`, and
  `signal` rather than roles. Light and dark modes therefore share colors, but not a clear contract
  for text, action, status, and material.
- **Typography is assembled per component.** The current UI contains repeated one-off sizes from
  `0.65rem` through `1.5rem`, aggressive negative tracking on several unrelated headings, and no
  serif role. Japanese body copy is readable, but display, editorial, navigation, metadata, and code
  do not form a deliberate hierarchy.
- **Spacing has no layout hierarchy.** Base spacing tokens exist, while page gutters, section
  intervals, list rows, and hero positioning still use unrelated literal values. The result is
  consistent at component scale but not at page scale.
- **Glass is used as a default shell treatment.** The sticky header always uses a large blur, and
  floating controls use broad shadows. This weakens the distinction between concrete reading
  surfaces and small translucent controls.
- **The home page does not have one focal point.** It is a long editorial landing page with Current,
  Works, Articles, and Fragments sections. The brief instead calls for a single-viewport entrance on
  normal desktop sizes.
- **The visual fallback contains a code-drawn plant.** Organic assets must be supplied as
  replaceable authored media, not synthesized in CSS or SVG. The existing plant path will be
  removed.
- **The 3D object is technically gated but visually generic.** It rotates an icosahedron on a simple
  periodic curve. It lacks material contrast, non-repeating motion, visibility pausing, and a
  quality tier.
- **Motion is mostly ungoverned.** Durations and easing are literal values. There is no shared
  reveal primitive or view-transition naming strategy.
- **Responsive layouts collapse, but do not fully recompose.** Navigation becomes a horizontally
  scrolling second row, large display titles retain aggressive proportions, and floating settings
  can compete with small-screen content.
- **Loading boundaries are generally sound.** WebGL is dynamically imported only on the home hero,
  images have dimensions, archive images are lazy-loaded, and article routes do not import the
  scene. These boundaries should be preserved and strengthened with visibility cleanup and
  deterministic fallbacks.

## Reference principles

The reference sites were inspected as systems, not templates. The useful shared principles are:

- reserve a large quiet field around one first-view subject;
- make a small number of type scales visibly different instead of varying every label;
- let image proportion and sequence create rhythm instead of placing every item in a card;
- keep navigation present but visually subordinate to the primary statement;
- use accent color sparingly enough that it retains meaning;
- on mobile, stack and reorder information rather than miniaturizing a desktop composition;
- start visual motion after readiness or intentional interaction, while keeping the static first
  frame complete.

No reference layout, animation, image, or code is copied. In particular, the reconstruction does not
reproduce the SALONIA case layout, Nagi Yoshida image grid, Yoru index table, YKOKD canvas, or any
supplied identity mark.

## New design tokens

### Semantic color

| Token                                                        | Role                                       |
| ------------------------------------------------------------ | ------------------------------------------ |
| `color-background`                                           | site canvas / exposed concrete             |
| `color-surface`                                              | opaque reading and list surface            |
| `color-foreground`                                           | primary text and essential strokes         |
| `color-primary`                                              | deep structural green / primary action     |
| `color-secondary`                                            | moss-toned secondary emphasis              |
| `color-accent`                                               | sparse signal light / focus / active state |
| `color-muted`                                                | secondary copy and metadata                |
| `color-line`                                                 | structure lines and separators             |
| `color-glass`                                                | small translucent overlays only            |
| `color-positive`                                             | successful or healthy status               |
| `color-negative`                                             | destructive or deprecated status           |
| `color-concrete`, `color-forest`, `color-moss`, `color-neon` | material palette for non-semantic artwork  |

Light and dark modes keep the same component structure. Only token values change.

### Type

- `font-sans`: Japanese body, UI, navigation, headings that explain structure.
- `font-serif`: large English statements, short poetic Japanese phrases, and quotations.
- `font-mono`: dates, coordinates, status, system labels, and code.
- `text-display`, `text-h1`, `text-h2`, `text-h3`, `text-body`, `text-small`, `text-caption`: the
  only shared text steps. Components may use fluid interpolation through these tokens, not
  independent literal scales.

Body copy remains 17–18px at normal browser settings, with a 68–74 character measure and generous
Japanese line height.

### Layout and material

- a 4px-derived spacing scale with semantic `layout-gutter`, `section-space`, and `content-width`
  tokens;
- square or subtly softened edges, with full circles reserved for status points;
- one restrained overlay shadow for floating controls only;
- a small glass blur token; article bodies and major page surfaces remain opaque;
- at least 44px for interactive targets.

### Motion

- `motion-duration-fast`: local state feedback;
- `motion-duration-base`: component entrance and line extension;
- `motion-duration-slow`: large mask or image clip reveal;
- `motion-ease-standard`: reversible state change;
- `motion-ease-enter`: material entering the composition;
- `motion-ease-exit`: material leaving the composition.

## Home wireframe

```text
┌──────────────────────────────────────────────────────────────┐
│ sample notice (only while sampleMode is enabled)             │
├──────────────────────────────────────────────────────────────┤
│ Lunacea        Articles  Works  Talks  Archive  About  Search│
│                                                              │
│  PERSONAL ARCHIVE / MORIOKA      coordinates / local time    │
│                                                              │
│  Quiet structures,                 ┌──────────────────────┐   │
│  growing records.                  │ asymmetric 3D /      │   │
│                                    │ geometric fallback   │   │
│  短いステートメント                └──────────────────────┘   │
│                                                              │
│  01 Articles   02 Works   03 Archive   04 About              │
│                                                              │
│  weather telemetry                         display controls  │
└──────────────────────────────────────────────────────────────┘
```

The main home frame uses `dvh`/`svh` and does not scroll on a normal desktop viewport. Low-height
screens, mobile layouts, text zoom, and the sample banner expand naturally and may scroll. Talks and
Search remain in the site navigation even though the four primary home portals are Articles, Works,
Archive, and About.

## Motion policy

- Static layout and fallback geometry are complete before JavaScript.
- Full motion may load WebGL after an idle boundary. It pauses while the document is hidden and
  disposes with its component.
- Reduced motion keeps a static geometric fallback and short opacity changes. Motion Off removes
  shared-element movement and reveals content immediately.
- Scroll reveals are limited to heading masks, line extension, image clipping, section indices, and
  subtle contrast. A shared IntersectionObserver adds state once; there is no scroll-jacking,
  letter-by-letter animation, or strong parallax.
- View Transitions name the identity, index title/detail title, and eligible media. The root does
  not receive a global fade. Unsupported browsers receive normal navigation.

## Existing components retained

- `SampleBanner`: content and noindex intent retained; visual treatment reduced.
- `SiteHeader` and `SiteFooter`: landmarks, routes, and keyboard order retained; appearance and
  mobile composition replaced.
- `SettingsPanel`: storage keys, events, labels, and form controls retained; glass scope and
  placement refined.
- `ContentList`, `ContentIndexPage`, and `ContentDetail`: data contracts retained; hierarchy,
  spacing, shared transitions, and reveal hooks rebuilt.
- `WeatherWidget`, `ReactionBar`, and `ReadingEnhancements`: behavior and tests retained; semantic
  tokens and small-screen surfaces aligned.
- `AmbientHero`: dynamic-import and deterministic-fallback boundary retained; organic SVG and scene
  implementation replaced.

## Styles removed or replaced

- visual-name tokens (`color-text`, `green-deep`, `moss`, `signal`) are replaced with semantic
  roles;
- component-specific font-size literals are replaced by type tokens;
- broad ambient shadows and the always-blurred header are removed;
- the home Current/Works/Articles/Fragments stack is removed from the entrance page;
- the code-drawn plant and CSS identity mark are removed and replaced by configurable media slots;
- periodic hero rotation is replaced by layered non-repeating motion in Full mode;
- literal transition durations/easings are replaced by motion tokens;
- content “cards” remain borderless list/image compositions rather than rounded SaaS panels.

## Replaceable authored-media contract

Organic imagery, profile photography, icons, logo art, and custom illustration are supplied through
a shared media-slot component and config. Each slot accepts `src`, `alt`, aspect ratio, object
position, visual variant, mobile crop, loading policy, opacity, and motion permission. An empty slot
renders a neutral structural placeholder in development/sample mode; it never invents an organic
subject.
