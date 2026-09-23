/**
 * どの遷移を使うかを URL と移動の種類だけから決める。DOM に触れないので単体で検証できる。
 * 実行（View Transition と印の付け外し）は page-transitions.ts が受け持つ。
 */

export type RouteTransitionPlan = {
  /** 一覧の表示切り替え（?view= だけが変わる）は短く、それ以外はページとして動かす。 */
  kind: "page" | "catalog";
  /** 紙面の受け渡し。一覧から記事へはせり上がり、記事から一覧へは元の行へ畳む。 */
  paper?: "rise" | "fold";
  /** ホームだけヘッダーを持たないので、出入りのときにヘッダーを動かす。 */
  header?: "enter" | "leave";
};

const listing = (url: URL) => url.pathname === "/" || url.pathname === "/articles";
const article = (url: URL) => /^\/articles\/[^/]+$/.test(url.pathname);

export function isCatalogViewChange(from: URL, to: URL): boolean {
  if (from.pathname !== to.pathname || from.hash !== to.hash) return false;
  const fromParams = new URLSearchParams(from.search);
  const toParams = new URLSearchParams(to.search);
  if (fromParams.get("view") === toParams.get("view")) return false;
  fromParams.delete("view");
  toParams.delete("view");
  fromParams.sort();
  toParams.sort();
  return fromParams.toString() === toParams.toString();
}

/**
 * 遷移させない移動には undefined を返す。同じページ内のアンカー移動と、絞り込みのように
 * 同じ一覧で条件だけが変わる移動は、内容の入れ替えに見せる必要がない。履歴移動（戻る・進む）も
 * リンクと同じ遷移にする。
 */
export function planRouteTransition(
  from?: URL | null,
  to?: URL | null,
): RouteTransitionPlan | undefined {
  if (!from || !to) return { kind: "page" };
  if (from.pathname === to.pathname) {
    if (isCatalogViewChange(from, to)) return { kind: "catalog" };
    return undefined;
  }
  const plan: RouteTransitionPlan = { kind: "page" };
  if (listing(from) && article(to)) plan.paper = "rise";
  if (article(from) && listing(to)) plan.paper = "fold";
  const fromHome = from.pathname === "/";
  const toHome = to.pathname === "/";
  if (fromHome && !toHome) plan.header = "enter";
  if (!fromHome && toHome) plan.header = "leave";
  return plan;
}
