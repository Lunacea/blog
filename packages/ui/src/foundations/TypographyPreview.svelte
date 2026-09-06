<main class="mx-auto grid w-[min(calc(100%-(2*var(--layout-gutter))),var(--content-width))] gap-(--space-20) py-(--section-space)">
  <header>
    <p class="m-0 text-caption text-quiet">Foundations / Typography</p>
    <h2 class="my-(--space-4) max-w-[12ch] font-serif text-display leading-display font-display tracking-display">静かな構造と記録</h2>
    <span class="text-caption text-quiet">Quiet structures, durable records.</span>
  </header>

  <section aria-labelledby="roles-title">
    <h3 class="mb-(--space-6) text-small tracking-label uppercase" id="roles-title">Mixed-language specimen</h3>
    <dl class="m-0 grid border-t border-rule [&>div]:grid [&>div]:grid-cols-[minmax(10rem,.4fr)_minmax(0,1fr)] [&>div]:items-baseline [&>div]:gap-(--space-6) [&>div]:border-b [&>div]:border-rule [&>div]:py-(--space-5) max-[44rem]:[&>div]:grid-cols-1 max-[44rem]:[&>div]:gap-(--space-2) [&_dt]:text-caption [&_dt]:text-quiet [&_dd]:m-0 [&_dd]:min-w-0 [&_dd]:wrap-anywhere [&_dd]:text-h3">
      <div><dt>日本語本文</dt><dd class="font-sans">静かな余白の中で、文章と記録を長く読み続けられる構造をつくる。</dd></div>
      <div><dt>English body</dt><dd class="font-sans">Durable interfaces keep content readable when optional features fail.</dd></div>
      <div><dt>Mixed body</dt><dd class="font-sans">SvelteKitとDenoで、Accessible Information Designを実装する。</dd></div>
      <div><dt>大見出し</dt><dd class="font-serif text-h1! leading-title">Quiet structures,<br />静かな記録。</dd></div>
      <div><dt>小見出し</dt><dd class="font-sans text-h2! font-component">Engineering and field notes</dd></div>
      <div><dt>Navigation</dt><dd class="font-sans text-small! tracking-ui">Articles　Works　Archive　Display</dd></div>
      <div><dt>日付と技術名</dt><dd class="font-sans tabular-nums">2026-07-16　SvelteKit / TypeScript / WebGL</dd></div>
      <div><dt>Code block</dt><dd class="font-mono text-small!"><pre class="m-0 max-w-full overflow-x-auto bg-panel p-(--space-4)"><code class="font-mono">const durable = content ?? fallback;</code></pre></dd></div>
      <div><dt>Inline code</dt><dd class="font-mono text-small!"><code class="font-mono">view=grid</code> と <kbd class="border border-rule px-(--space-1) font-mono">Escape</kbd> はFira Codeを使う。</dd></div>
    </dl>
  </section>

  <section aria-labelledby="measure-title">
    <h3 class="mb-(--space-6) text-small tracking-label uppercase" id="measure-title">Reading measure</h3>
    <p class="m-0 max-w-(--prose-width) text-body leading-body">
      日本語とLatin textが混在する長文でも、行長、句読点、英数字の間隔が落ち着いて見えることを確認します。Design tokens keep the reading rhythm consistent across narrow and wide viewports.
    </p>
  </section>
</main>
