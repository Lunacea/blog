export type FilterValues = Record<string, string>;

export function parseFilterQuery(
  search: string,
  allowed: Readonly<Record<string, readonly string[] | undefined>>,
): FilterValues {
  const params = new URLSearchParams(search);
  const result: FilterValues = {};
  for (const [key, values] of Object.entries(allowed)) {
    const value = params.get(key)?.trim();
    if (value && (!values || values.includes(value))) result[key] = value;
  }
  return result;
}

export function updateFilterQuery(search: string, values: FilterValues): string {
  const params = new URLSearchParams(search);
  for (const [key, value] of Object.entries(values)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
