/**
 * 記事から一覧へ戻るとき、紙面を元の行へ畳む。受け渡し先の行を探す処理と、補間の形を決める
 * 純粋な計算と、それを View Transition の擬似要素へ当てる処理に分ける。
 */

type Box = Pick<DOMRect, "left" | "top" | "width" | "height" | "bottom">;

export type FoldFrames = {
  group: { from: Record<string, string>; to: Record<string, string> };
  image: { from: Record<string, string>; to: Record<string, string> };
};

/**
 * 紙面は記事全体の高さを持つため、そのまま行へ補間すると画面外の下端が一気に上がってくる。
 * 補間の始まりを見えていた範囲に切り詰め、旧紙面の像もその範囲が見える位置へずらす。
 * 群が行の幅まで縮むと像も同じ比で縮むので、ずらす量もその比で縮める。
 */
export function foldFrames(paper: Box, row: Box, viewportHeight: number): FoldFrames {
  const top = Math.max(paper.top, 0);
  const bottom = Math.min(paper.bottom, viewportHeight);
  const height = Math.max(bottom - top, row.height);
  const offset = top - paper.top;
  const scale = row.width / Math.max(paper.width, 1);
  return {
    group: {
      from: {
        transform: `translate(${paper.left}px, ${top}px)`,
        width: `${paper.width}px`,
        height: `${height}px`,
      },
      to: {
        transform: `translate(${row.left}px, ${row.top}px)`,
        width: `${row.width}px`,
        height: `${row.height}px`,
      },
    },
    image: { from: { top: `${-offset}px` }, to: { top: `${-offset * scale}px` } },
  };
}

/** 戻った一覧で、その記事の行が画面内にあれば返す。画面外なら畳まずに溶かすだけにする。 */
export function findFoldRow(pathname: string) {
  const link = [...document.querySelectorAll<HTMLAnchorElement>(".index-list a[href]")]
    .find((candidate) => candidate.pathname === pathname);
  const row = link?.closest("li");
  if (!row) return undefined;
  const bounds = row.getBoundingClientRect();
  if (bounds.bottom <= 0 || bounds.top >= innerHeight) return undefined;
  return { row, bounds };
}

/**
 * UA の補間を上書きする。呼び出し側は遷移が終わったら返した動きを取り消すこと。fill を残すと、
 * 次の遷移で作られる同名の擬似要素に行の形が当たり、せり上がる紙面が小さく始まってしまう。
 */
export function foldPaperIntoRow(
  paper: Box,
  row: Box,
  timing: { duration: number; easing: string },
): Animation[] {
  const frames = foldFrames(paper, row, innerHeight);
  const root = document.documentElement;
  const options = { ...timing, fill: "both" as const };
  return [
    root.animate([frames.group.from, frames.group.to], {
      ...options,
      pseudoElement: "::view-transition-group(article-paper)",
    }),
    root.animate([frames.image.from, frames.image.to], {
      ...options,
      pseudoElement: "::view-transition-old(article-paper)",
    }),
  ];
}
