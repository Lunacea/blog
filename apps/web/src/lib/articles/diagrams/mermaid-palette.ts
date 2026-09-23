/**
 * Mermaid をサイトの配色と形で描くための設定。Mermaid は色を計算して SVG へ焼き込むため、
 * CSS 変数ではなく具体的な色を渡す必要がある。
 *
 * 主要な色トークンは `<color>` として登録されていて、`:root` の時点で表示中のテーマに確定する。
 * 表示していないテーマの図も先に描いて控えるため、`:root` の宣言をそのまま probe 要素へ写し、
 * probe に `color-scheme` を指定してブラウザに解決させる。式を自前で展開しないので、トークンの
 * 書き方（`var()` の入れ子、`light-dark()`、`color-mix()`）が変わっても壊れない。
 */

export type DiagramScheme = "light" | "dark";

/**
 * テーマに依存しない `:root` の宣言。`:root[data-theme=...]` のような条件付きの規則は
 * 表示中のテーマにしか当たらないので読まない。値はスタイルシートが変わらない限り同じ。
 */
let rootDeclarations: Array<[string, string]> | undefined;

function readRootDeclarations() {
  if (rootDeclarations) return rootDeclarations;
  const found = new Map<string, string>();
  const collect = (rules: CSSRuleList) => {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        const unconditional = rule.selectorText.split(",").some((selector) =>
          selector.trim() === ":root"
        );
        if (!unconditional) continue;
        for (const name of rule.style) {
          if (name.startsWith("--")) found.set(name, rule.style.getPropertyValue(name));
        }
      } else if (rule instanceof CSSMediaRule) {
        if (matchMedia(rule.media.mediaText).matches) collect(rule.cssRules);
      } else if (rule instanceof CSSSupportsRule) {
        if (CSS.supports(rule.conditionText)) collect(rule.cssRules);
      } else if ("cssRules" in rule) {
        collect((rule as CSSGroupingRule).cssRules);
      }
    }
  };
  for (const sheet of document.styleSheets) {
    try {
      collect(sheet.cssRules);
    } catch { /* 別オリジンのシートは読めない。 */ }
  }
  rootDeclarations = [...found];
  return rootDeclarations;
}

/** 半透明の色は図の地に重ねた不透明色にする。Mermaid の色計算は透明度を扱いきれない。 */
function flatten(context: CanvasRenderingContext2D, color: string, ground: string) {
  context.clearRect(0, 0, 1, 1);
  context.fillStyle = ground;
  context.fillRect(0, 0, 1, 1);
  context.fillStyle = color;
  context.fillRect(0, 0, 1, 1);
  const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
  return `#${[r, g, b].map((part) => part.toString(16).padStart(2, "0")).join("")}`;
}

function withProbe<T>(scheme: DiagramScheme, host: Element, read: (probe: HTMLElement) => T) {
  const probe = document.createElement("span");
  probe.hidden = true;
  for (const [name, value] of readRootDeclarations()) probe.style.setProperty(name, value);
  probe.style.colorScheme = scheme;
  /*
   * 本番の CSS は古いブラウザ向けに light-dark() を --lightningcss-light / --lightningcss-dark の
   * 切り替えへ書き換える。color-scheme だけでは切り替わらないので、その2つも合わせて置く。
   * 空の値は setProperty では置けないため cssText に書き足す。
   */
  const light = scheme === "light" ? "initial" : " ";
  const dark = scheme === "dark" ? "initial" : " ";
  probe.style.cssText += `--lightningcss-light:${light};--lightningcss-dark:${dark};`;
  host.append(probe);
  try {
    return read(probe);
  } finally {
    probe.remove();
  }
}

export function mermaidConfig(scheme: DiagramScheme, host: Element) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return undefined;
  return withProbe(scheme, host, (probe) => {
    const resolve = (expression: string) => {
      probe.style.color = expression;
      return getComputedStyle(probe).color;
    };
    // 長さのトークンは幅に入れて px の計算値として読む（rem や clamp() もここで解決される）。
    const length = (token: string) => {
      probe.style.width = `var(${token})`;
      return Number.parseFloat(getComputedStyle(probe).width) || 0;
    };
    const ground = flatten(context, resolve("var(--color-surface)"), "transparent");
    const tone = (expression: string) => flatten(context, resolve(expression), ground);
    const tint = (percent: number) =>
      tone(`color-mix(in srgb, var(--color-foreground) ${percent}%, var(--color-surface))`);
    const ink = tone("var(--color-foreground)");
    const node = tint(5);
    const edge = tint(34);
    const line = tint(58);
    const rule = tone("var(--color-line)");
    const radius = length("--radius-card");
    const hairline = length("--border-width-rule") || 1;
    const fontSize = length("--text-small");
    return {
      startOnLoad: false,
      securityLevel: "strict" as const,
      theme: "base" as const,
      fontFamily: getComputedStyle(probe).getPropertyValue("--font-sans").trim(),
      flowchart: { curve: "basis" as const, padding: 18, nodeSpacing: 44, rankSpacing: 52 },
      themeVariables: {
        darkMode: scheme === "dark",
        fontSize: fontSize ? `${fontSize}px` : undefined,
        background: ground,
        primaryColor: node,
        primaryTextColor: ink,
        primaryBorderColor: edge,
        secondaryColor: tint(10),
        secondaryTextColor: ink,
        secondaryBorderColor: edge,
        tertiaryColor: tint(3),
        tertiaryTextColor: ink,
        tertiaryBorderColor: rule,
        mainBkg: node,
        nodeBorder: edge,
        nodeTextColor: ink,
        textColor: ink,
        titleColor: ink,
        lineColor: line,
        edgeLabelBackground: ground,
        clusterBkg: tint(3),
        clusterBorder: rule,
        noteBkgColor: tint(8),
        noteTextColor: ink,
        noteBorderColor: edge,
      },
      /*
       * 形は紙面の部品に合わせる。角はカードと同じ丸み、枠は罫線と同じ細さ、線は少しだけ太く。
       * Mermaid が図ごとの id で閉じた規則として差し込むので、既定の規則より後に効く。
       */
      themeCSS: `
        .node rect, .node polygon, .node circle, .node ellipse, .node path {
          stroke-width: ${hairline}px;
        }
        .node rect, .cluster rect { rx: ${radius}px; ry: ${radius}px; }
        .flowchart-link, .edgePath .path { stroke-width: ${hairline * 1.25}px; }
        .nodeLabel, .edgeLabel, .label { letter-spacing: normal; }
        .edgeLabel, .edgeLabel p { background-color: ${ground}; }
      `,
    };
  });
}
