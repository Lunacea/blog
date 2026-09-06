# Visual Asset and WebGL Agent Instructions

## Purpose

This directory owns authored visual media, asset placeholders, WebGL enhancements, and experimental
typography.

These features must remain optional enhancements to the site's content and navigation.

## Asset ownership

Do not fabricate user-authored imagery.

The user must provide final assets for:

- portraits
- profile icons
- logos
- plants
- animals
- hands
- organic illustrations
- detailed landscapes
- branded GIF animations
- complex decorative SVG
- photographic compositions

When an asset is unavailable, use `AssetPlaceholder`.

Every placeholder must display:

- a stable asset ID such as `ASSET-001`
- intended role
- target aspect ratio
- preferred file type
- expected accessibility description
- whether transparency is required

Do not fill the placeholder with an invented illustration.

## Simple SVG

Codex may create simple SVG when it is:

- geometric
- structural
- diagrammatic
- technical
- non-branded
- understandable from basic primitives

Examples include:

- lines
- circles
- rectangles
- grids
- simple arrows
- simple diagrams
- basic masks
- loading marks

Do not approximate a complex authored asset with a large generated SVG path.

## WebGL geometry

WebGL scenes must prefer forms with clear geometry and symmetry.

Approved starting forms include:

- cuboids
- cubes
- spheres
- rings
- tori
- regular polyhedra
- simple crystals
- Möbius strips
- simple waves
- simple particle fields with restrained counts

Avoid:

- detailed organic models
- realistic people
- animals
- plants
- furniture
- architecture requiring complex modeling
- high-polygon decorative meshes
- opaque shader experiments with no visual rationale
- scenes that resemble generic technology landing-page templates

A WebGL form must have a stated visual role.

Do not add geometry solely because Three.js is available.

## WebGL typography

WebGL and shader-assisted typography are welcome when they:

- preserve text meaning
- have an accessible HTML equivalent
- use readable words or letterforms
- fit the site's identity
- degrade to static typography
- remain within performance budgets

The HTML heading or text remains the semantic source of truth.

WebGL text must not be the only representation of important content.

Do not require users to wait for font geometry or shaders before reading the page.

## Interaction

WebGL interaction may respond to:

- pointer proximity
- focus
- scrolling
- page state
- time of day
- documented weather conditions

Interactions must remain restrained and understandable.

Do not require precise pointer movement to access content.

Provide keyboard-accessible equivalent behavior when interaction changes meaning or reveals
information.

Do not make the custom cursor the only explanation of a WebGL interaction.

## Loading

Load WebGL only under the conditions documented in `architecture.md`.

Preserve:

- dynamic import
- idle loading
- save-data fallback
- low-capability fallback
- reduced-motion fallback
- WebGL unsupported fallback
- static SVG fallback

Do not import the WebGL dependency graph into Article or other content routes.

The Home page's essential text and navigation must exist before WebGL loads.

Visual Svelte components use the same Tailwind-only styling contract as the rest of `ui` and must
not contain `<style>` blocks. Generated aspect ratios and renderer coordinates may cross the DOM
boundary as CSS custom properties; reusable palette, sizing, motion, and depth values remain in
`foundations/theme.css`.

## GIF

Use GIF only when supplied by the user.

Do not generate, download, or select a temporary third-party GIF.

A missing GIF must remain an asset placeholder.

Respect reduced motion by replacing animated GIF with an approved still image when one is available.
If no still image exists, do not autoplay the animated asset under reduced-motion conditions.

## Failure behavior

If WebGL initialization or rendering fails:

- remove the failed canvas cleanly
- preserve the static fallback
- preserve all text and navigation
- avoid repeated initialization attempts
- avoid blocking the main thread
- avoid displaying a technical error to ordinary visitors

Record diagnostic information only through the project's approved, privacy-preserving logging
behavior.

## Validation

Verify:

- static fallback
- no-WebGL environment
- reduced motion
- save-data
- narrow mobile
- low device capability
- keyboard access
- JavaScript-disabled content
- canvas cleanup
- route navigation away from Home
- no dependency leakage into content-page bundles
- production bundle budget
