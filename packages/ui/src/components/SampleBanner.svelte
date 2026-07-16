<aside class="sample-banner" aria-label="サンプルモード">
  <div class="shell">
    <span>Sample archive</span>
    <p>現在の内容は構造と表示を確認するための交換可能な見本です。</p>
  </div>
</aside>

<style>
  aside {
    border-bottom: 1px solid var(--color-line);
    background: color-mix(in srgb, var(--color-accent) 9%, var(--color-background));
  }

  div {
    display: flex;
    min-height: 2.5rem;
    align-items: center;
    gap: var(--space-4);
  }

  span {
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  p {
    margin: 0;
    color: var(--color-muted);
    font-size: var(--text-small);
  }

  @media (max-width: 44rem) {
    div {
      align-items: flex-start;
      flex-direction: column;
      gap: 0;
      padding-block: var(--space-2);
    }
  }
</style>
