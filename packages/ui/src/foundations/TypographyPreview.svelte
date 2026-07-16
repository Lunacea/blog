<main class="typography-preview">
  <header>
    <p>Foundations / Typography</p>
    <h2>静かな構造と記録</h2>
    <span>Quiet structures, durable records.</span>
  </header>

  <section aria-labelledby="roles-title">
    <h3 id="roles-title">Type roles</h3>
    <dl>
      <div class="editorial"><dt>Editorial serif</dt><dd>余白と文章のリズムを読む。</dd></div>
      <div class="interface"><dt>Interface sans</dt><dd>検索、設定、状態を明快に伝える。</dd></div>
      <div class="technical"><dt>Technical mono</dt><dd>2026-07-15 / 39.702°N / stable</dd></div>
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
    font-family: var(--font-mono);
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
    font-size: var(--text-h3);
  }

  .editorial dd { font-family: var(--font-serif); }
  .interface dd { font-family: var(--font-sans); }
  .technical dd { font-family: var(--font-mono); font-size: var(--text-small); }

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
