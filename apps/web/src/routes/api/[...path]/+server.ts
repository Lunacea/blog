import { createApi } from "@lunacea/api";

const api = createApi();
// 開発時 SvelteKit が global fetch を一時的に差し替えるため、クライアントは一度だけ捕まえる。
const infrastructureFetch = globalThis.fetch.bind(globalThis);
const handle = ({ request }: { request: Request }) =>
  api.fetch(request, { fetcher: infrastructureFetch });

export const GET = handle;
export const POST = handle;
export const PUT = handle;
