<main class="typography-preview">
  <header>
    <p>Foundations / Typography</p>
    <h2>静かな構造と記録</h2>
    <span>Quiet structures, durable records.</span>
  </header>

  <section aria-labelledby="roles-title">
    <h3 id="roles-title">Mixed-language specimen</h3>
    <dl>
      <div class="interface"><dt>日本語本文</dt><dd>静かな余白の中で、文章と記録を長く読み続けられる構造をつくる。</dd></div>
      <div class="interface"><dt>English body</dt><dd>Durable interfaces keep content readable when optional features fail.</dd></div>
      <div class="interface"><dt>Mixed body</dt><dd>SvelteKitとDenoで、Accessible Information Designを実装する。</dd></div>
      <div class="editorial display"><dt>大見出し</dt><dd>Quiet structures,<br />静かな記録。</dd></div>
      <div class="interface heading"><dt>小見出し</dt><dd>Engineering and field notes</dd></div>
      <div class="interface nav"><dt>Navigation</dt><dd>Articles　Works　Archive　Display</dd></div>
      <div class="interface date"><dt>日付と技術名</dt><dd>2026-07-16　SvelteKit / TypeScript / WebGL</dd></div>
      <div class="technical code"><dt>Code block</dt><dd><pre><code>const durable = content ?? fallback;</code></pre></dd></div>
      <div class="technical"><dt>Inline code</dt><dd><code>view=grid</code> と <kbd>Escape</kbd> はFira Codeを使う。</dd></div>
    </dl>
  </section>

  <section class="measure" aria-labelledby="measure-title">
    <h3 id="measure-title">Reading measure</h3>
    <p>
      日本語とLatin textが混在する長文でも、行長、句読点、英数字の間隔が落ち着いて見えることを確認します。Design tokens keep the reading rhythm consistent across narrow and wide viewports.
    </p>
  </section>
</main>

<style>
  .typography-preview {
    display: grid;
    gap: var(--space-20);
    width: min(calc(100% - (2 * var(--layout-gutter))), var(--content-width));
    margin-inline: auto;
    padding-block: var(--section-space);
  }

  header p,
  header span,
  dt {
    color: var(--color-muted);
    font-size: var(--text-caption);
  }

  header p,
  h2,
  h3,
  dd,
  .measure p {
    margin: 0;
  }

  h2 {
    max-width: 12ch;
    margin-block: var(--space-4);
    font-family: var(--font-serif);
    font-size: var(--text-display);
    font-weight: var(--weight-display);
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-display);
  }

  h3 {
    margin-bottom: var(--space-6);
    font-size: var(--text-small);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  dl {
    display: grid;
    margin: 0;
    border-top: 1px solid var(--color-line);
  }

  dl div {
    display: grid;
    grid-template-columns: minmax(10rem, 0.4fr) minmax(0, 1fr);
    align-items: baseline;
    gap: var(--space-6);
    border-bottom: 1px solid var(--color-line);
    padding-block: var(--space-5);
  }

  dd {
    min-width: 0;
    font-size: var(--text-h3);
    overflow-wrap: anywhere;
  }

  .editorial dd { font-family: var(--font-serif); }
  .interface dd { font-family: var(--font-sans); }
  .technical dd { font-family: var(--font-mono); font-size: var(--text-small); }
  .display dd { font-size: var(--text-h1); line-height: var(--leading-title); }
  .heading dd { font-size: var(--text-h2); font-weight: var(--weight-component); }
  .nav dd { font-size: var(--text-small); letter-spacing: var(--tracking-ui); }
  .date dd { font-variant-numeric: tabular-nums; }
  pre { max-width: 100%; overflow-x: auto; margin: 0; padding: var(--space-4); background: var(--color-surface); }
  code, kbd { font-family: var(--font-mono); }
  kbd { border: 1px solid var(--color-line); padding: 0 var(--space-1); }

  .measure p {
    max-width: var(--prose-width);
    font-size: var(--text-body);
    line-height: var(--leading-body);
  }

  @media (max-width: 44rem) {
    dl div {
      grid-template-columns: 1fr;
      gap: var(--space-2);
    }
  }
</style>
