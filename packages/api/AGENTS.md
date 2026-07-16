# API Package Instructions

This package owns HTTP boundaries, external requests, cookies, rate limits, and persistence
repositories.

- Keep Hono inside the SvelteKit deployment unit.
- Validate every external input at the HTTP boundary.
- Preserve same-origin mutation protections and input-size limits.
- Do not persist IP addresses, User-Agent strings, location, or email.
- Keep Deno KV behind a repository interface.
- Memory and Deno KV implementations must satisfy the same contract tests.
- Aggregate and actor-selection writes must remain atomic.
- External API failure must return the documented degraded response.
- Do not expose internal persistence details in public API responses.
- Add regression tests for security, rate-limit, and concurrency behavior.
