# Header, Works rail, composition graph, and motion redesign

> Superseded for all remaining work by `tailwind-ui-package-consolidation.md`; completed changes in
> the current dirty worktree remain the baseline and are not reverted.

## Goal

Stabilize the persistent header, lead catalogs with their controls, replace the Works grid with a
horizontal snap rail that persists around detail routes, simplify Archive detail, visualize Article
composition, and introduce restrained staged motion without making content depend on JavaScript.

## Non-goals

- Content IDs, slugs, frontmatter schemas, canonical detail URLs, and public content files do not
  change.
- Article routes do not import Three.js.
- Archive source bodies are not deleted; they stop rendering on public detail pages.
- The site does not adopt a third-party scroll or animation runtime.

## Constraints

- Preserve and build on the existing user-owned uncommitted worktree.
- Public HTML, navigation, Works detail, and Archive summary remain available without JavaScript.
- Full motion may add stagger and media parallax; Reduced/Off, save-data, forced-colors, hidden
  tabs, and unsupported APIs remain static.
- Works keeps `/works/:slug`, prerendering, global non-circular numbering, and query-based filters.
- Architecture and design-system contract edits are a distinct milestone after implementation.

## Milestones

1. Add build-time Article composition analysis, public types, generated registry, and tests.
2. Stabilize Header controls and reorder catalog headings, controls, and record counts.
3. Move Works catalog into a persistent route layout with horizontal snap, filtered route state,
   inline detail navigation, and no Works WebGL graph.
4. Implement deterministic Archive composition, summary-only details, and Article-only related
   records.
5. Add composition graphs, TOC integration, reveal stagger/media parallax, and the Home opening.
6. Synchronize accepted architecture/design documentation and run the validation matrix.

## Progress

- [x] Existing worktree, repository/package instructions, current routes, motion, content pipeline,
      reference pages, and accepted architecture inspected.
- [ ] Milestone 1
- [ ] Milestone 2
- [ ] Milestone 3
- [ ] Milestone 4
- [ ] Milestone 5
- [ ] Milestone 6

## Decisions and discoveries

- Archive uses a stable asymmetric grid derived from slug hashes, not runtime randomness.
- Works keeps canonical detail routes through a persistent `/works` layout; obsolete `view` queries
  are tolerated but dropped by the next catalog interaction.
- Desktop wheel input is converted only while the Works rail can consume it; native scrolling wins
  at boundaries and inside nested scroll regions.
- Article composition is derived from SVX source into 48 time-normalized samples without changing
  frontmatter.
- Home opening plays once per tab and never waits for WebGL to become ready.
- The existing Works WebGL architecture and budget are retired rather than adapted to the rail.

## Validation log

Record exact commands and outcomes here during implementation.

## Remaining risks

- Horizontal wheel behavior and parallax feel need physical-device review after automated tests.
- Composition weights are estimates and require visual review across short and long real articles.
- Browser View Transition and bfcache behavior varies by engine and requires fallback verification.
