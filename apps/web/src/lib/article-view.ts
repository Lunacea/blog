/** 一覧のレイアウトは `view` パラメータのみで決まる。 */
export function articleView(params: URLSearchParams): "grid" | "list" {
  return params.get("view") === "list" ? "list" : "grid";
}

/** 日ごとに決定論的に選ぶ。サーバ描画・ハイドレーション・共有キャッシュの結果を一致させるため。 */
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

/** 記事が少ないうちは時系列を崩さない。 */
export function serendipityCount(poolSize: number): number {
  if (poolSize >= 6) return 3;
  return poolSize >= 4 ? 2 : 0;
}

export function dayNumber(now: Date): number {
  return Math.floor(now.getTime() / 86_400_000);
}
