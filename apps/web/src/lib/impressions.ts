/**
 * Records one anonymous impression for an article. The page never blocks on it, a failure is
 * silent, and a session that already counted an article does not count it again.
 */
export function recordImpression(type: string, slug: string): void {
  const key = `lunacea-impression:${type}:${slug}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    // Private modes without session storage simply record once per page view.
  }
  void fetch(`/api/v1/impressions/${type}/${slug}`, {
    method: "POST",
    keepalive: true,
    headers: { "content-length": "0" },
  }).catch(() => undefined);
}
