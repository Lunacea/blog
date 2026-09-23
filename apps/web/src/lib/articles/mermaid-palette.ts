/**
 * Mermaid をサイトの配色で描くための色。Mermaid は色を計算して SVG へ焼き込むため、CSS 変数ではなく
 * 具体的な色を渡す必要がある。
 *
 * 主要な色トークンは `<color>` として登録されており、`:root` の時点で表示中のテーマに確定する。
 * 表示していないテーマの図も先に描いて控えるため、トークンの宣言そのものを CSSOM から読み、
 * `var()` を展開した式を `color-scheme` を指定した probe で解決する。
 */

export type DiagramScheme = "light" | "dark";

let declarations: Map<string, string> | undefined;

/** `:root` に宣言されたカスタムプロパティの生の値。スタイルシートは実行中に変わらないので一度だけ読む。 */
function rootDeclarations() {
  if (declarations) return declarations;
  const found = new Map<string, string>();
  const walk = (rules: CSSRuleList) => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && /(^|,)\s*:root\b/.test(rule.selectorText)) {
        for (const name of Array.from(rule.style)) {
          if (name.startsWith("--") && !found.has(name)) {
            found.set(name, rule.style.getPropertyValue(name).trim());
          }
        }
      }
      if ("cssRules" in rule && (rule as CSSGroupingRule).cssRules) {
        walk((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      walk(sheet.cssRules);
    } catch { /* 別オリジンのシートは読めない。 */ }
  }
  declarations = found;
  return found;
}

/** 登録済みトークンの確定を避けるため、参照先の宣言を式へ埋め込む。 */
function expand(value: string, depth = 0): string {
  if (depth > 8) return value;
  return value.replace(
    /var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g,
    (_, name: string, fallback?: string) => {
      const raw = rootDeclarations().get(name) ?? fallback ?? "";
      return expand(raw, depth + 1);
    },
  );
}

/** 半透明の色は図の地に重ねた不透明色にする。Mermaid は色計算で透明度を扱いきれない。 */
function flatten(context: CanvasRenderingContext2D, color: string, ground: string) {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = ground;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

export function diagramThemeVariables(scheme: DiagramScheme, host: Element) {
  const probe = document.createElement("span");
  probe.hidden = true;
  probe.style.colorScheme = scheme;
  host.append(probe);
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  const resolve = (expression: string) => {
    probe.style.color = "";
    probe.style.color = expand(expression);
    return getComputedStyle(probe).color;
  };
  try {
    if (!context) return undefined;
    const ground = flatten(context, resolve("var(--color-surface)"), "transparent");
    const tone = (expression: string) => flatten(context, resolve(expression), ground);
    const ink = tone("var(--color-foreground)");
    const muted = tone("var(--color-muted)");
    const tint = (percent: number) =>
      tone(`color-mix(in srgb, var(--color-foreground) ${percent}%, var(--color-surface))`);
    const node = tint(6);
    const edge = tint(58);
    return {
      darkMode: scheme === "dark",
      fontFamily: expand("var(--font-sans)"),
      background: ground,
      primaryColor: node,
      primaryTextColor: ink,
      primaryBorderColor: edge,
      secondaryColor: tint(12),
      secondaryTextColor: ink,
      secondaryBorderColor: edge,
      tertiaryColor: tint(3),
      tertiaryTextColor: ink,
      tertiaryBorderColor: tone("var(--color-line)"),
      mainBkg: node,
      nodeBorder: edge,
      nodeTextColor: ink,
      textColor: ink,
      titleColor: ink,
      lineColor: muted,
      edgeLabelBackground: ground,
      clusterBkg: tint(3),
      clusterBorder: tone("var(--color-line)"),
      noteBkgColor: tint(9),
      noteTextColor: ink,
      noteBorderColor: edge,
    };
  } finally {
    probe.remove();
  }
}
