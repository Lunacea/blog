# Repository Agent Instructions

## Project purpose

This repository contains a personal blog and portfolio built as a SvelteKit modular monolith.

The site must prioritize:

- readable and accessible public content
- progressive enhancement
- low initial JavaScript cost
- stable Git-managed content
- privacy-preserving anonymous reactions
- a consistent editorial visual identity
- graceful degradation when optional features fail

Do not optimize one of these goals by silently violating another.

## Sources of truth

Before making changes, read the documents relevant to the task:

- `docs/architecture.md` for system boundaries and architectural decisions
- `docs/design-system.md` for colors, typography, spacing, motion, imagery, and component styling
- `docs/content-model.md` for content types, frontmatter, IDs, and validation
- the closest package-level `AGENTS.md`
- existing tests and neighboring implementations

`docs/architecture.md` is an accepted architectural contract only when its status is marked
`Accepted`.

If the requested task conflicts with an accepted architectural decision:

1. do not silently work around it;
2. identify the conflict;
3. explain the affected decision;
4. propose an ADR or architecture-document update;
5. keep the implementation separate from the architectural change.

Repository code and documentation must not intentionally disagree after the task is complete.

## Package manager and commands

Use the package manager declared by the repository's `packageManager` field and lockfile.

Do not migrate package managers as part of an unrelated task.

Run only scripts that actually exist in the repository. Inspect the root and package-level
`package.json` files before choosing commands. Do not invent script names.

Prefer the smallest relevant validation first, followed by the repository-wide checks required for
the changed area.

## Architectural invariants

Unless the task explicitly changes the architecture through an approved plan:

- SvelteKit remains the only deployment unit.
- Hono remains inside the SvelteKit HTTP boundary and must not become a separately deployed server.
- Public content remains Git-managed `.svx`.
- Anonymous reaction state and rate-limit state remain in Deno KV.
- Weather data is cacheable environmental data and must not become persistent user data.
- `core` must remain independent of DOM APIs, Deno KV, network access, and `fetch`.
- External infrastructure must be accessed through explicit interfaces.
- Public package dependency directions described in `docs/architecture.md` must be preserved.
- Article and content pages must not import the homepage Hero, Threlte, or Three.js dependency
  graph.
- Optional visual features must not block access to the primary content.
- Progressive enhancement must be preserved.

Do not introduce circular package dependencies.

## Rendering boundaries

Preserve the documented rendering model:

- content lists, content detail pages, About, tags, feeds, sitemap, and OGP are prerendered;
- search remains usable through a GET form without JavaScript;
- `/api/v1` is the dynamic HTTP boundary;
- Mermaid loads only when required by the rendered article;
- Threlte and Three.js load only when the documented motion and device conditions are satisfied.

Do not convert prerendered routes to SSR or client-side rendering merely because it makes an
implementation easier.

Any rendering-boundary change requires an explicit plan that documents:

- why the current boundary is insufficient;
- SEO and accessibility effects;
- caching implications;
- JavaScript and deployment impact;
- rollback strategy.

## Performance

Treat performance budgets as acceptance criteria, not optional recommendations.

- Preserve the article-detail initial JavaScript gzip budget documented in `docs/architecture.md`.
- Keep Mermaid, WebGL, and other heavy enhancements outside the article initial dependency graph.
- Do not add a large dependency when a small local implementation or existing dependency is
  sufficient.
- Avoid global client-side state for route-local behavior.
- Avoid unnecessary hydration.
- Prefer server-rendered or prerendered HTML for public content.

When changing dependencies, dynamic imports, routing, or shared UI, run the applicable bundle or
budget checks.

Report measured results rather than claiming that a change is lightweight.

## Privacy and security

The reaction system must remain anonymous and privacy-preserving.

Do not store or log:

- IP addresses
- User-Agent strings
- precise location
- email addresses
- raw identifiers that are unnecessary for the documented reaction model

Preserve:

- same-origin mutation checks
- Zod validation at HTTP boundaries
- documented input-size limits
- Secure, HttpOnly, SameSite cookie behavior
- actor-level rate limiting
- atomic aggregate and selection updates
- repository interfaces for persistence implementations

Do not weaken these protections to simplify local development or testing.

Use an in-memory implementation with the same repository contract where appropriate.

Never add secrets, tokens, production data, or personal data to source files, fixtures, snapshots,
logs, or documentation.

## Content rules

Content IDs and slugs are stable public identifiers.

Do not casually rename:

- content directories
- slugs
- `type:slug` identifiers
- public routes

Changes to stable identifiers require a migration and redirect plan.

Content validation must continue to detect, where applicable:

- invalid frontmatter
- duplicate IDs
- slug and directory mismatches
- invalid related-content IDs
- broken internal links
- missing cover assets
- external image hotlinks

Do not bypass validation by weakening schemas or changing invalid fields to optional without
explaining the content-model consequences.

## Visual design and assets

Follow `docs/design-system.md` when it exists.

Do not invent a new visual language inside an isolated component.

Use semantic design tokens rather than repeated literal values for:

- primary
- secondary
- accent
- background
- foreground
- muted colors
- typography
- spacing
- radius
- shadows
- motion

Use the documented Japanese-compatible sans-serif and serif font roles.

Do not generate organic brand imagery such as people, plants, animals, hands, portraits, or
logo-like illustrations in code.

Authored visual assets must be provided through `config.visualAssets` and rendered through the
established media-slot abstraction.

Codex may create simple geometric, structural, or technical SVG elements when the task explicitly
requires them and they are not brand assets.

Do not replace missing authored artwork with generic AI-looking gradients, blobs, glass cards, or
decorative illustrations.

## Accessibility and resilience

All user-visible changes must preserve or improve:

- semantic HTML
- keyboard operation
- visible focus
- meaningful accessible names
- heading hierarchy
- color contrast
- reduced-motion support
- save-data and low-capability fallbacks
- content access without JavaScript where documented

Failures in weather, Mermaid, WebGL, or reactions must not prevent reading or navigating the site.

Use live regions only for relevant asynchronous status messages. Do not create noisy announcements.

## Working procedure

Before editing:

1. inspect `git status`;
2. treat existing uncommitted changes as user-owned;
3. identify the relevant packages, routes, tests, and documentation;
4. read the closest `AGENTS.md`;
5. verify the current implementation instead of relying only on filenames or documentation;
6. determine whether the task requires a direct change, a short plan, or an ExecPlan.

During implementation:

- make the smallest coherent change that satisfies the acceptance criteria;
- reuse existing patterns before creating new abstractions;
- avoid unrelated cleanup;
- do not rewrite whole files when a focused edit is sufficient;
- add or update tests for changed behavior;
- keep documentation synchronized with changed contracts;
- preserve public APIs unless the task explicitly changes them.

When ordinary implementation details are unclear, inspect the repository and make the least
disruptive decision.

Do not make autonomous product, branding, privacy, public-API, data-model, or architecture
decisions. Surface those decisions explicitly.

## Planning policy

Use a direct implementation for small, well-scoped changes with no architectural, schema, API,
storage, privacy, or design-system impact.

Use Plan mode for changes that:

- affect multiple modules;
- introduce a new user-visible interaction;
- alter rendering or loading behavior;
- require several implementation steps;
- have unclear acceptance criteria.

Use an ExecPlan following `.agent/PLANS.md` for changes that:

- affect multiple packages;
- change schemas, public APIs, storage, routing, or stable content IDs;
- modify privacy or security behavior;
- modify prerendering or deployment boundaries;
- add or significantly change WebGL, Mermaid, search, reactions, or build tooling;
- introduce a new design system or major homepage redesign;
- require migration or rollback steps.

## Validation

After editing:

1. run the smallest relevant tests;
2. run relevant type and Svelte checks;
3. run lint and formatting checks;
4. run content validation when content or schema behavior changes;
5. run build and budget checks when routing, shared UI, dependencies, or rendering changes;
6. inspect the relevant page or interaction when behavior is visual;
7. inspect the final Git diff for unrelated changes.

Report:

- exact commands executed;
- whether each command passed or failed;
- failures that existed before the change;
- checks that could not be run;
- manual verification still required.

Never describe an unexecuted check as passing.

## Git and scope safety

- Do not discard, overwrite, stage, commit, push, or rebase user changes unless explicitly
  requested.
- Do not create commits unless explicitly requested.
- Do not modify generated files manually.
- Do not edit lockfiles unless dependency resolution actually changes.
- Do not add production dependencies without explaining the need and alternatives.
- Do not modify unrelated files merely to make the diff look cleaner.

## Definition of done

A task is complete only when:

- its acceptance criteria are satisfied;
- architectural and package boundaries remain valid;
- privacy, accessibility, and progressive-enhancement requirements are preserved;
- relevant tests and checks have been run;
- no unexplained unrelated changes remain;
- documentation reflects any changed public contract;
- the final response lists changed files, verification results, risks, and remaining manual checks.
