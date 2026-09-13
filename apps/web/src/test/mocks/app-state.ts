/** SvelteKit's `$app/state` for component tests: a route with no query to read. */
export const page = {
  url: new URL("http://localhost/"),
  params: {} as Record<string, string>,
  route: { id: null as string | null },
  status: 200,
  error: null,
  data: {} as Record<string, unknown>,
  form: null,
};
export const navigating = null;
export const updated = { current: false };
