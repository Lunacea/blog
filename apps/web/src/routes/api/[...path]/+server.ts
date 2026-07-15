import { createApi } from "@lunacea/api";

const api = createApi();
const handle = ({ request, fetch }: { request: Request; fetch: typeof globalThis.fetch }) =>
  api.fetch(request, { fetcher: fetch });

export const GET = handle;
export const PUT = handle;
