import { createApi } from "@lunacea/api";

const api = createApi();
// SvelteKit temporarily instruments global fetch while rendering in development. Capture the
// infrastructure client once so concurrent weather requests cannot be mistaken for eager SSR work.
const infrastructureFetch = globalThis.fetch.bind(globalThis);
const handle = ({ request }: { request: Request }) =>
  api.fetch(request, { fetcher: infrastructureFetch });

// One export per method the Hono app answers: a method missing here is a 405 from SvelteKit
// before the request ever reaches the API.
export const GET = handle;
export const POST = handle;
export const PUT = handle;
