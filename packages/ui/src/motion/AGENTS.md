# Motion Agent Instructions

## Purpose

This directory owns motion behavior for the design system.

Motion must clarify hierarchy, continuity, state, and spatial relationships.

Do not add animation merely to make a page appear more sophisticated.

## Motion tokens

Use duration and easing tokens from:

`src/foundations/theme.css`

Do not introduce local timing curves or durations unless a motion experiment has been explicitly
approved.

Maintain a small motion vocabulary:

- immediate feedback
- micro-interaction
- component enter and exit
- page transition
- home opening
- ambient WebGL motion

## Home opening

Only the Home route may use a dedicated opening animation.

The opening may last approximately one to two seconds.

It must:

- remain simple
- reveal real page content rather than delay it
- be skippable through reduced-motion behavior
- avoid blocking navigation
- avoid replaying on every small client-side state change
- have a static fallback
- not require WebGL to complete

Do not add opening animations to Article, Work, About, Search, tag, or other content routes.

## Page transitions

Use gentle page transitions that preserve orientation and reading continuity.

Prefer restrained combinations of:

- opacity
- small translation
- masking
- typographic transition
- shared visual continuity

Do not animate every descendant independently.

Do not delay route completion for decorative animation.

Do not interfere with:

- browser back and forward
- anchor links
- focus restoration
- scroll restoration
- reduced motion
- no-JavaScript navigation

Content pages should transition more quietly than the Home route.

## Micro-interactions

Interactive animation must correspond to state.

Examples:

- menu closed to open
- disclosure collapsed to expanded
- play to pause
- loading to complete
- pointer entering a WebGL region
- focus entering an interactive control

The hamburger control must be implemented as a semantic button with local line geometry or simple
SVG paths.

It must support:

- open and closed states
- keyboard operation
- visible focus
- `aria-expanded`
- `aria-controls`
- Escape dismissal where applicable
- reduced-motion fallback

Do not represent both hamburger and close states as unrelated static icons that abruptly swap unless
the approved design explicitly calls for that.

## Reduced motion

When `prefers-reduced-motion: reduce` is active:

- remove opening sequences
- remove parallax
- remove large translations
- remove cursor interpolation
- stop nonessential loops
- replace page motion with immediate or short opacity changes
- keep state changes understandable

Reduced motion must not remove content or functionality.

## Performance

Prefer transform and opacity for frequent animation.

Avoid layout-triggering animation for continuous effects.

Do not create an application-wide animation loop unless a visible feature requires it.

Pause ambient animation when:

- the document is hidden
- the relevant element is outside the viewport
- the device fallback conditions apply
- reduced motion is enabled

Do not add an animation dependency when native CSS, Svelte transitions, or a small local
implementation is sufficient.

## Custom cursor

The custom cursor must be implemented as an optional enhancement.

Use a limited state model such as:

- default
- interactive
- text or selection
- media
- WebGL
- drag

Do not create component-specific cursor states without updating the central contract.

The native cursor remains active whenever the enhancement is unavailable or inappropriate.

Cursor animation must be lightweight and must not continuously read layout for every pointer event.

## Validation

Verify:

- keyboard behavior
- reduced motion
- interrupted transitions
- rapid navigation
- browser back and forward
- touch devices
- coarse pointer devices
- hidden-tab behavior
- focus after dialogs and menus close
- absence of unexpected layout shifts
