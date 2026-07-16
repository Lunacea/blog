# Design System Agent Instructions

## Purpose

This package owns the visual and interaction design system for the portfolio.

The design system must provide an accessible behavioral foundation while preserving a distinctive
editorial and artistic identity.

Do not produce a generic shadcn dashboard aesthetic.

The design should feel intentional, spacious, calm, tactile, and original without relying on
excessive decoration.

## Required references

Before changing this package, read:

- the repository root `AGENTS.md`
- `docs/architecture.md`
- `docs/design-system.md`
- `components.json`
- the installed shadcn-svelte Skill
- the closest nested `AGENTS.md`
- neighboring components and their tests

Use the shadcn-svelte Skill for current component APIs, CLI behavior, Svelte 5 patterns, and Bits UI
composition rules.

Project-specific instructions in this file override the default visual choices shown in
shadcn-svelte examples.

## Technology

- Use Svelte 5 and SvelteKit.
- Use Tailwind CSS 4.
- Use Bits UI as the preferred headless behavioral primitive.
- Use local shadcn-svelte source components where an appropriate primitive already exists.
- Do not introduce another overlapping component framework without an approved plan.
- Do not import React shadcn/ui packages.

Use existing primitives before writing new accessibility or interaction behavior from scratch.

Do not treat the default shadcn-svelte appearance as the site's design language. Rework styles
through the project's theme, variants, composition, and motion rules.

## Directory responsibilities

Keep UI code separated by role.

### `foundations`

Owns:

- the Tailwind theme
- global styles
- typography configuration
- font loading
- foundational accessibility styles

It must not contain page-specific component implementations.

### `primitives`

Owns low-level reusable controls and behaviors such as:

- Button
- Dialog
- Tooltip
- Popover
- Select
- Checkbox
- Menu
- Tabs

Prefer Bits UI and shadcn-svelte source as the behavioral foundation.

Primitives must not know about portfolio content types, routes, weather, articles, works, or API
repositories.

### `layout`

Owns spatial composition only:

- Container
- Section
- Stack
- Cluster
- Grid
- Split
- Bleed

Layout components must not add decorative cards, shadows, borders, or business semantics.

### `components`

Owns reusable semantic UI with one clear responsibility.

Examples:

- ArticleCard
- WorkMeta
- SocialLink
- ReactionControl
- MediaCaption

### `patterns`

Owns multi-component compositions used as page sections.

Examples:

- Hero
- ProfileIntroduction
- FeaturedWorks
- ArticleCollection
- ContactSection

Patterns may compose primitives, layout, and components but must not become alternative routing or
data-loading layers.

### `icons`

Owns all UI and brand icon resolution.

Application code must not import arbitrary icon packages directly.

### `motion`

Owns micro-interactions, page transitions, opening animation, and custom cursor behavior.

### `visuals`

Owns authored media slots, asset placeholders, WebGL enhancements, and typographic visual
experiments.

Do not place complex SVG or WebGL implementations in general-purpose components.

## Theme source of truth

Use Tailwind CSS 4 theme variables.

All reusable values for the following must be defined in exactly one source-of-truth file:

`src/foundations/theme.css`

This includes:

- colors
- typography families
- type scale
- font weights
- line heights
- letter spacing
- spacing scale
- container sizes
- breakpoints
- radii
- shadows
- blur
- motion durations
- easing curves
- z-index conventions where represented as project variables

Use `@theme` or `@theme inline` as appropriate.

Do not define competing theme values in:

- Svelte components
- route styles
- JavaScript constants
- other CSS files
- inline styles
- Tailwind arbitrary values

A component may use a one-off literal value only when all of the following are true:

1. the value is genuinely specific to that implementation;
2. it is not a reusable design decision;
3. no existing token expresses it;
4. the reason is documented next to the implementation.

Do not create an arbitrary Tailwind value merely to make a screenshot look closer without evaluating
whether the theme token should change.

`global.css` may contain selectors, resets, scrollbar rules, body styles, forced-color behavior, and
browser-specific fallbacks, but must reference tokens from `theme.css` rather than defining a second
token system.

## Visual identity

The design system is not a collection of generic cards.

Prefer:

- whitespace
- typography
- composition
- scale
- rhythm
- restrained color contrast
- intentional motion
- authored visual assets

Do not add borders, shadows, blur, glass effects, or rounded corners by default.

Every border, radius, or shadow must have a functional or compositional reason.

Avoid:

- card grids where plain document structure is sufficient
- excessive pill shapes
- uniformly rounded containers
- permanent glassmorphism
- large generic gradients
- decorative blobs
- generic dashboard layouts
- visual effects copied directly from shadcn examples
- identical treatment for every section

Use serif and sans-serif according to the documented typography roles.

Use Japanese-capable fonts and preserve readable Japanese line length, line height, punctuation, and
word breaking.

## Spacing and layout

The interface should have generous breathing room.

Use the documented spacing and container tokens instead of local, uncoordinated margins.

Prefer structural layout components over repeated class strings.

Do not solve every spacing issue by adding more wrappers.

Spacing must remain coherent at:

- narrow mobile widths
- tablet widths
- desktop widths
- wide desktop widths
- increased browser text size

Avoid dense interface patterns unless the content genuinely requires them.

## Headless component policy

For controls with complex focus, keyboard, overlay, dismissal, selection, or ARIA behavior:

1. check whether an existing local primitive exists;
2. check whether shadcn-svelte provides the component;
3. check whether Bits UI provides an appropriate primitive;
4. compose or extend the existing primitive;
5. write a new behavior implementation only when the existing options are insufficient.

Do not recreate dialogs, menus, listboxes, comboboxes, tooltips, popovers, or focus traps solely to
obtain a custom appearance.

The visual layer may be completely customized, but accessibility behavior must remain intact.

Do not expose raw shadcn-svelte defaults directly to route code. Route and pattern code should
consume this project's local design-system exports.

## Icon system

Use Iconify through the local `Icon.svelte` abstraction.

Do not import Iconify icons ad hoc in route or component files.

Use two approved collections:

- `solar:*` for general interface symbols
- `simple-icons:*` only for official technology, service, product, and social-media logos

Use one Solar style throughout general UI. Default to:

`solar:*:linear`

Do not mix Solar linear, outline, bold, broken, and duotone styles within the same interface without
an approved design-system change.

Brand marks must use the correct official glyph where available.

Render brand marks through the same local Icon component and normalize:

- size
- alignment
- optical spacing
- accessible labeling
- color behavior

Prefer monochrome `currentColor` rendering. Use official brand colors only when the design
specification explicitly requires them.

Every technical stack or social-service item with a recognized brand mark must be capable of
displaying its corresponding icon.

Icons are supportive, not a replacement for all text.

Do not create icon-only navigation when a visible text label improves understanding.

An icon-only interactive control must have an accessible name and an appropriate visible tooltip
when its meaning is not universally clear.

## Emoji prohibition

Do not use emoji as interface graphics, labels, decoration, status indicators, bullets, navigation
symbols, empty states, or fallback icons.

This prohibition applies to application chrome and design-system UI.

Do not automatically alter emoji that intentionally appears inside editorial article content unless
the task explicitly requests content editing.

## Micro-interactions

Do not model every interaction as a static Iconify icon.

Implement interaction-specific forms locally when shape transformation is part of the meaning.

Examples include:

- hamburger to close transition
- play to pause transition
- expandable disclosure indicator
- loading mark
- cursor state
- navigation transition indicator

The hamburger menu trigger should be a semantic button with locally drawn lines or simple CSS/SVG
geometry so the open and closed states can morph coherently.

Simple icons may be rotated, translated, faded, or scaled when the icon shape itself does not need
to transform.

Animation must not compensate for unclear information architecture.

## GIF assets

GIF may be used only as a user-provided authored asset.

Do not generate, download, invent, or substitute a GIF.

When a required GIF is missing, render the standard asset placeholder with:

- a stable asset number
- expected aspect ratio
- intended placement
- concise asset requirements
- meaningful fallback text

Do not use an animated GIF for behavior that is better implemented through CSS, SVG, Svelte
transitions, or WebGL.

## Authored images and complex SVG

Do not implement complex organic illustrations, portraits, plants, animals, hands, logos, or
authored brand imagery as SVG code.

Wait for user-provided assets.

Until an asset is provided, use `AssetPlaceholder` and display:

- asset number
- expected dimensions or aspect ratio
- expected file type
- intended content description

The placeholder must preserve layout without pretending to be final art.

Simple geometric or technical SVG may be implemented when it is structural, not a substitute for
authored artwork.

## Scrollbars

Preserve native scrolling behavior.

Apply the site's visual language using standard scrollbar styling and tokenized browser fallbacks.

Do not make the page scrollbar completely undiscoverable.

Do not replace normal document scrolling with a JavaScript-controlled scroll system.

Use native scrollbar behavior in:

- forced-colors mode
- unsupported browsers
- accessibility fallbacks

A decorative scroll-progress indicator may supplement the native scrollbar but must not replace it.

## Cursor

A custom cursor is a progressive enhancement.

Enable it only for devices matching fine-pointer and hover capabilities.

Do not hide or replace the native cursor on:

- touch devices
- coarse pointers
- reduced-motion configurations
- forced-colors mode
- text-entry controls
- text-selection contexts
- initialization failure
- JavaScript-disabled pages

The cursor may react to interactive elements and WebGL regions, but it must not be the only
indication that an element is interactive.

Cursor states must be defined centrally and remain limited in number.

Do not create distracting cursor trails or continuous high-cost particle effects.

## Accessibility

Preserve or improve:

- semantic HTML
- native control behavior
- keyboard operation
- visible focus
- correct ARIA
- accessible names
- heading hierarchy
- text alternatives
- color contrast
- reduced-motion behavior
- forced-colors behavior
- zoom and text resizing
- touch target size
- no-JavaScript access where documented

Prefer visible labels over icon-only controls.

Do not use ARIA to imitate a native element when a native element is available.

Decorative icons must be hidden from assistive technology.

Meaningful icons must have an accessible label supplied by the containing control or nearby text.

## UX decision gate

Do not make an autonomous UX or product decision when it materially changes:

- navigation structure
- information hierarchy
- meaning of an action
- content priority
- reading flow
- interaction modality
- discoverability
- accessibility tradeoffs
- destructive behavior
- persistence expectations
- mobile behavior

When such a decision is encountered:

1. identify the decision explicitly;
2. explain the user impact;
3. present the smallest set of viable alternatives;
4. avoid implementing the disputed behavior;
5. continue with unblocked structural work or a reversible placeholder.

Do not use the decision gate for ordinary implementation details that can be resolved from the
design system and existing code.

## Validation

For design-system changes, run the scripts that actually exist for:

- formatting
- lint
- Svelte checks
- type checking
- unit or component tests
- accessibility tests
- production build
- JavaScript budget checks

For visual work, verify at minimum:

- narrow mobile
- tablet
- desktop
- wide desktop
- keyboard-only navigation
- increased text size
- reduced motion
- forced colors when supported
- JavaScript-disabled behavior where promised

Inspect the final diff for:

- arbitrary colors
- arbitrary spacing
- unapproved icon sets
- emoji in UI
- unnecessary borders
- unnecessary shadows
- unnecessary rounded containers
- imported heavy dependencies
- direct route imports from Bits UI or icon libraries
- duplicated design tokens

Report unexecuted visual checks as unexecuted.
