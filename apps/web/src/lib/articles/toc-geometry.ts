/**
 * 目次の追従バーと分布マップの位置。どちらも目次の各行の実寸から決める。
 */

/** 追従バーは行より少しはみ出させ、行の上下の余白ごと現在地として示す。 */
const markerBleed = 2;
/** 分布マップの各節は行より少し内側に描き、追従バーの端と次の節との間に余白を残す。 */
const mapInset = 5;

export type TocSpan = { id: string; start: number; end: number };

/** 各見出し行が一覧の高さに占める範囲（割合）。分布マップはこれに射影する。 */
export function tocSpans(list: HTMLElement, ids: readonly string[]): TocSpan[] {
  const total = list.offsetHeight || 1;
  const rows = [...list.children] as HTMLElement[];
  return ids.flatMap((id, index) => {
    const row = rows[index];
    if (!row) return [];
    return [{
      id,
      start: (row.offsetTop + mapInset) / total,
      end: (row.offsetTop + row.offsetHeight - mapInset) / total,
    }];
  });
}

/** 現在地の行に重ねる追従バーの位置と高さ。`bleed` を 0 にすると行ちょうどに重ねる。 */
export function markerBounds(list: HTMLElement | null, bleed = markerBleed) {
  const row = list?.querySelector<HTMLAnchorElement>('a[aria-current="location"]')
    ?.closest<HTMLLIElement>("li");
  if (!list || !row) return undefined;
  const top = Math.max(0, row.offsetTop - bleed);
  const bottom = Math.min(list.offsetHeight, row.offsetTop + row.offsetHeight + bleed);
  return { y: top, height: bottom - top };
}
