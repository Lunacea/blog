/**
 * The catalog layout follows the `view` parameter alone. Categories are always visible and search
 * lives in the Header, so a filtered URL no longer has to fall back to the list to stay operable.
 */
export function articleView(params: URLSearchParams): "grid" | "list" {
  return params.get("view") === "list" ? "list" : "grid";
}

/** Deterministic per-day picks keep server rendering, hydration and shared caches in agreement. */
export function serendipityPicks<T>(pool: readonly T[], count: number, day: number): T[] {
  const picks: T[] = [];
  const remaining = [...pool];
  let seed = (day * 2654435761) >>> 0;
  while (picks.length < count && remaining.length) {
    seed = (seed ^ (seed << 13)) >>> 0;
    seed = (seed ^ (seed >>> 17)) >>> 0;
    seed = (seed ^ (seed << 5)) >>> 0;
    picks.push(remaining.splice(seed % remaining.length, 1)[0]);
  }
  return picks;
}

/** A small archive keeps its chronology; a larger one can spare three records for the box. */
export function serendipityCount(poolSize: number): number {
  if (poolSize >= 6) return 3;
  return poolSize >= 4 ? 2 : 0;
}

export function dayNumber(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}
