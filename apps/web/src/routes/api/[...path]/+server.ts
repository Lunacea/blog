import { createApi } from "@lunacea/api";
import { resolveReactionTarget } from "@lunacea/content";

const api = createApi({ resolveReactionTarget });
// SvelteKit temporarily instruments global fetch while rendering in development. Capture the
// infrastructure client once so concurrent weather requests cannot be mistaken for eager SSR work.
const infrastructureFetch = globalThis.fetch.bind(globalThis);
const handle = ({ request }: { request: Request }) =>
  api.fetch(request, { fetcher: infrastructureFetch });

export const GET = handle;
export const PUT = handle;
