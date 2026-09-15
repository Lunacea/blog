/**
 * 記事の匿名閲覧を1回記録する。ページはこれを待たず、失敗は無視し、
 * 同一セッションで既に数えた記事は二重に数えない。
 */
export function recordImpression(type: string, slug: string): void {
  const key = `lunacea-impression:${type}:${slug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage が使えない環境ではページ表示ごとに1回記録する。
  }
  void fetch(`/api/v1/impressions/${type}/${slug}`, {
    method: "POST",
    keepalive: true,
    headers: { "content-length": "0" },
  }).catch(() => undefined);
}
