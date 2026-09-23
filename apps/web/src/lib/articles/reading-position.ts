/**
 * 読んでいる位置。本文の読了率と、いま読んでいる節（目次で示す見出し）を求める。
 */

/** 見出しが画面の最上部に届く前に現在地として扱う。アンカー線から画面の 1/4 下。 */
const activationShare = 0.24;

export function readingProgress(prose: DOMRect, viewportHeight: number): number {
  const available = prose.height - viewportHeight;
  if (available <= 0) return 100;
  return Math.min(100, Math.max(0, (-prose.top / available) * 100));
}

/** 活性化線より上にある最後の見出し。どれも届いていなければ最初の見出し。 */
export function currentHeading(
  headings: ReadonlyArray<{ id: string; top: number }>,
  activation: number,
): string {
  let current = headings[0]?.id ?? "";
  for (const heading of headings) {
    if (heading.top > activation) break;
    current = heading.id;
  }
  return current;
}

export function trackReadingPosition(
  prose: HTMLElement,
  headings: readonly HTMLElement[],
  {
    requested,
    onChange,
  }: {
    /** 目次から選んだ直後は、スクロールの途中でも選んだ見出しを現在地とする。 */
    requested: () => string;
    onChange: (state: { progress: number; active: string }) => void;
  },
): () => void {
  // 見出しの scroll-margin はアンカー線の位置。どの見出しも同じ値を持つ。
  const anchor = headings[0]
    ? Number.parseFloat(getComputedStyle(headings[0]).scrollMarginTop) || 0
    : 0;
  let frame = 0;
  const update = () => {
    frame = 0;
    const progress = readingProgress(prose.getBoundingClientRect(), innerHeight);
    const active = requested() || currentHeading(
      headings.map((heading) => ({ id: heading.id, top: heading.getBoundingClientRect().top })),
      anchor + innerHeight * activationShare,
    );
    onChange({ progress, active });
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  update();
  addEventListener("scroll", schedule, { passive: true });
  addEventListener("resize", schedule);
  return () => {
    if (frame) cancelAnimationFrame(frame);
    removeEventListener("scroll", schedule);
    removeEventListener("resize", schedule);
  };
}
