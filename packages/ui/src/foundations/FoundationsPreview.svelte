<script lang="ts">
  const colors = [
    ["Background", "--color-background"],
    ["Surface", "--color-surface"],
    ["Foreground", "--color-foreground"],
    ["Primary", "--color-primary"],
    ["Secondary", "--color-secondary"],
    ["Accent", "--color-accent"],
    ["Muted", "--color-muted"],
    ["Positive", "--color-positive"],
    ["Negative", "--color-negative"],
  ] as const;

  const typography = [
    ["Display", "--text-display"],
    ["Heading 1", "--text-h1"],
    ["Heading 2", "--text-h2"],
    ["Heading 3", "--text-h3"],
    ["Body", "--text-body"],
    ["Small", "--text-small"],
    ["Caption", "--text-caption"],
  ] as const;

  const spacing = ["--space-1", "--space-2", "--space-4", "--space-8", "--space-16"] as const;
</script>

<main class="foundations-preview">
  <section aria-labelledby="color-heading">
    <div class="heading">
      <p>Foundations / 01</p>
      <h2 id="color-heading">Semantic color</h2>
    </div>
    <ul class="colors">
      {#each colors as [label, token]}
        <li style={`--preview-value: var(${token})`}>
          <span aria-hidden="true"></span>
          <strong>{label}</strong>
          <code>{token}</code>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="type-heading">
    <div class="heading">
      <p>Foundations / 02</p>
      <h2 id="type-heading">Type scale</h2>
    </div>
    <div class="type-scale">
      {#each typography as [label, token]}
        <p style={`--preview-type: var(${token})`}>
          <span>{label}</span>静かな構造
        </p>
      {/each}
    </div>
  </section>

  <section aria-labelledby="space-heading">
    <div class="heading">
      <p>Foundations / 03</p>
      <h2 id="space-heading">Spacing rhythm</h2>
    </div>
    <ul class="spacing">
      {#each spacing as token}
        <li><code>{token}</code><span style={`--preview-space: var(${token})`}></span></li>
      {/each}
    </ul>
  </section>
</main>

<style>
  .foundations-preview {
    display: grid;
    gap: var(--space-16);
  }

  section {
    display: grid;
    grid-template-columns: minmax(12rem, 0.45fr) minmax(0, 1fr);
    gap: var(--space-8);
    border-top: 1px solid var(--color-line);
    padding-top: var(--space-5);
  }

  .heading p,
  code,
  .type-scale span {
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  code {
    overflow-wrap: anywhere;
  }

  .heading p {
    margin: 0 0 var(--space-2);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
  }

  h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .colors {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: var(--space-3);
  }

  .colors li {
    display: grid;
    gap: var(--space-2);
  }

  .colors li > span {
    min-height: var(--space-16);
    border: 1px solid var(--color-line);
    background: var(--preview-value);
  }

  .colors strong {
    font-size: var(--text-small);
    font-weight: var(--weight-component);
  }

  .type-scale {
    min-width: 0;
  }

  .type-scale p {
    display: grid;
    grid-template-columns: 7rem minmax(0, 1fr);
    align-items: baseline;
    margin: 0;
    border-bottom: 1px solid var(--color-line);
    padding-block: var(--space-3);
    font-family: var(--font-serif);
    font-size: var(--preview-type);
    line-height: var(--leading-tight);
  }

  .spacing {
    display: grid;
    gap: var(--space-3);
  }

  .spacing li {
    display: grid;
    grid-template-columns: 8rem minmax(0, 1fr);
    align-items: center;
    gap: var(--space-4);
  }

  .spacing span {
    display: block;
    width: var(--preview-space);
    height: var(--space-4);
    background: var(--color-primary);
  }

  @media (max-width: 52rem) {
    section {
      grid-template-columns: 1fr;
    }

    .colors {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .type-scale p {
      grid-template-columns: 1fr;
      gap: var(--space-1);
      overflow-wrap: anywhere;
    }

    .spacing li {
      grid-template-columns: 1fr;
      gap: var(--space-1);
    }
  }
</style>
