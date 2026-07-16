# Content Package Instructions

This package owns `.svx` discovery, validation, registries, plain-text extraction, and
search-document generation.

- Content validation must be deterministic and build-time safe.
- Do not perform network requests during content validation.
- Do not weaken a Zod schema solely to make invalid existing content pass.
- Stable content IDs and slugs must not change without a migration plan.
- Internal links, related IDs, cover files, and hotlinks must remain validated.
- Search indexing must not depend on browser APIs.
- Preserve Japanese tokenization using the documented Segmenter and bigram strategy unless an
  approved plan changes it.
- Add focused fixtures for validation edge cases.
- Run content validation and the relevant search tests after changes.
