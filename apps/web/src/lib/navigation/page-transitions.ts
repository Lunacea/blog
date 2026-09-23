import { afterNavigate, onNavigate } from "$app/navigation";
import { motionDuration, motionEasing } from "$lib/motion-tokens.ts";
import { findFoldRow, foldPaperIntoRow } from "./paper-fold.ts";
import { planRouteTransition, type RouteTransitionPlan } from "./route-transition.ts";

/**
 * ページ遷移の実行。どの遷移にするかは route-transition.ts が決め、ここは View Transition を
 * 起こして、遷移の間だけ付ける印と動きを1つの後片付けにまとめる。
 *
 * CSS（transitions.css）が見る印：
 * - data-route-kind="catalog"   一覧の表示切り替え（短い遷移）
 * - data-route-paper="rise|fold" 紙面の受け渡し
 * - data-route-header="enter|leave" ヘッダーの出入り
 * - data-route-exit              旧状態の撮影の間だけ。旧本文を snapshot にする
 * - data-route-enter="page|catalog" 新しい本文の live DOM の入り（遷移より長く残る）
 * - 行の data-route-fold-row     紙面を畳む先の行
 */

const root = () => document.documentElement;

/** View Transition を使える状態か。遷移の種類ではなく、端末と設定だけを見る。 */
export function canAnimateRoutes(): boolean {
  return typeof document.startViewTransition === "function" &&
    document.visibilityState === "visible" &&
    root().dataset.motion === "full";
}

/** 遷移1回分の後片付け。終わり・保険のタイマー・次の遷移の始まりのどれからでも一度だけ走る。 */
function createSession() {
  const disposers: Array<() => void> = [];
  let finished = false;
  return {
    add(dispose: () => void) {
      if (finished) dispose();
      else disposers.push(dispose);
    },
    finish() {
      if (finished) return;
      finished = true;
      for (const dispose of disposers.splice(0).reverse()) dispose();
    },
  };
}

type Session = ReturnType<typeof createSession>;

function mark(session: Session, name: string, value: string) {
  root().dataset[name] = value;
  session.add(() => delete root().dataset[name]);
}

/** 新しい本文の入りは遷移より長いので、入りの動きが終わるまで印を残す。 */
function markEntering(kind: RouteTransitionPlan["kind"]) {
  const content = document.querySelector<HTMLElement>(".route-content");
  root().dataset.routeEnter = kind;
  const settle = () => {
    clearTimeout(fallback);
    content?.removeEventListener("animationend", onEnd);
    if (root().dataset.routeEnter === kind) delete root().dataset.routeEnter;
  };
  const onEnd = (event: AnimationEvent) => {
    if (event.target === content) settle();
  };
  content?.addEventListener("animationend", onEnd);
  const fallback = globalThis.setTimeout(settle, 1200);
  return settle;
}

/**
 * 絞り込み（同じ一覧で条件だけが変わる移動）は読み位置を保つ。履歴移動の位置は
 * ブラウザと SvelteKit が戻すので触らない。
 */
function keepCatalogPosition() {
  let position: { x: number; y: number } | undefined;
  afterNavigate(() => {
    if (!position) return;
    const { x, y } = position;
    position = undefined;
    requestAnimationFrame(() => requestAnimationFrame(() => scrollTo(x, y)));
  });
  return (navigation: { type: string; from: URL | undefined; to: URL | undefined }) => {
    if (
      navigation.type !== "popstate" && navigation.from && navigation.to &&
      navigation.from.pathname === navigation.to.pathname &&
      navigation.from.search !== navigation.to.search
    ) {
      position = { x: scrollX, y: scrollY };
    }
  };
}

export function installPageTransitions() {
  if (typeof document === "undefined") return () => {};
  const rememberCatalog = keepCatalogPosition();
  let active: Session | undefined;
  let settleEntering: (() => void) | undefined;

  onNavigate((navigation) => {
    active?.finish();
    active = undefined;
    settleEntering?.();
    settleEntering = undefined;
    const from = navigation.from?.url;
    const to = navigation.to?.url;
    rememberCatalog({ type: navigation.type, from, to });

    const plan = planRouteTransition(from, to);
    if (!plan || !canAnimateRoutes()) return;

    const session = createSession();
    active = session;
    if (plan.kind === "catalog") mark(session, "routeKind", "catalog");
    if (plan.paper === "rise") mark(session, "routePaper", "rise");
    if (plan.header) mark(session, "routeHeader", plan.header);
    mark(session, "routeExit", "true");
    // 畳む先が決まるのは新しい一覧が描かれた後なので、紙面の位置は旧状態のうちに測っておく。
    const paper = plan.paper === "fold"
      ? document.querySelector(".article-paper")?.getBoundingClientRect()
      : undefined;
    let fold: { paper: DOMRect; row: DOMRect } | undefined;

    return new Promise<void>((resolve) => {
      const transition = document.startViewTransition(async () => {
        // 旧状態の撮影は済んでいる。新しい本文は live DOM で入るので名前を外す。
        delete root().dataset.routeExit;
        resolve();
        await navigation.complete;
        const target = paper && from ? findFoldRow(from.pathname) : undefined;
        if (paper && target) {
          target.row.dataset.routeFoldRow = "true";
          session.add(() => delete target.row.dataset.routeFoldRow);
          mark(session, "routePaper", "fold");
          fold = { paper, row: target.bounds };
        }
        settleEntering = markEntering(plan.kind);
      });
      void transition.ready.then(() => {
        if (!fold) return;
        const animations = foldPaperIntoRow(fold.paper, fold.row, {
          duration: motionDuration("page"),
          easing: motionEasing("signature"),
        });
        session.add(() => animations.forEach((animation) => animation.cancel()));
      }, () => {});
      const fallback = globalThis.setTimeout(session.finish, 1500);
      session.add(() => clearTimeout(fallback));
      void transition.finished.finally(() => {
        session.finish();
        if (active === session) active = undefined;
      });
    });
  });

  return () => {
    active?.finish();
    settleEntering?.();
  };
}
