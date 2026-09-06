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

<main class="grid gap-(--space-16)">
  <section class="grid grid-cols-[minmax(12rem,.45fr)_minmax(0,1fr)] gap-(--space-8) border-t border-rule pt-(--space-5) max-[52rem]:grid-cols-1" aria-labelledby="color-heading">
    <div>
      <p class="mb-(--space-2) font-mono text-caption tracking-label text-quiet uppercase">Foundations / 01</p>
      <h2 class="m-0 font-serif text-h3 font-regular" id="color-heading">Semantic color</h2>
    </div>
    <ul class="m-0 grid list-none grid-cols-3 gap-(--space-3) p-0 max-[52rem]:grid-cols-2">
      {#each colors as [label, token]}
        <li class="grid gap-(--space-2)" style={`--preview-value: var(${token})`}>
          <span class="min-h-(--space-16) border border-rule bg-(--preview-value)" aria-hidden="true"></span>
          <strong class="text-small font-component">{label}</strong>
          <code class="wrap-anywhere font-mono text-caption text-quiet">{token}</code>
        </li>
      {/each}
    </ul>
  </section>

  <section class="grid grid-cols-[minmax(12rem,.45fr)_minmax(0,1fr)] gap-(--space-8) border-t border-rule pt-(--space-5) max-[52rem]:grid-cols-1" aria-labelledby="type-heading">
    <div>
      <p class="mb-(--space-2) font-mono text-caption tracking-label text-quiet uppercase">Foundations / 02</p>
      <h2 class="m-0 font-serif text-h3 font-regular" id="type-heading">Type scale</h2>
    </div>
    <div class="min-w-0">
      {#each typography as [label, token]}
        <p class="m-0 grid grid-cols-[7rem_minmax(0,1fr)] items-baseline border-b border-rule py-(--space-3) font-serif text-(length:--preview-type) leading-tight max-[52rem]:grid-cols-1 max-[52rem]:gap-(--space-1) max-[52rem]:wrap-anywhere" style={`--preview-type: var(${token})`}>
          <span class="font-mono text-caption text-quiet">{label}</span>静かな構造
        </p>
      {/each}
    </div>
  </section>

  <section class="grid grid-cols-[minmax(12rem,.45fr)_minmax(0,1fr)] gap-(--space-8) border-t border-rule pt-(--space-5) max-[52rem]:grid-cols-1" aria-labelledby="space-heading">
    <div>
      <p class="mb-(--space-2) font-mono text-caption tracking-label text-quiet uppercase">Foundations / 03</p>
      <h2 class="m-0 font-serif text-h3 font-regular" id="space-heading">Spacing rhythm</h2>
    </div>
    <ul class="m-0 grid list-none gap-(--space-3) p-0">
      {#each spacing as token}
        <li class="grid grid-cols-[8rem_minmax(0,1fr)] items-center gap-(--space-4) max-[52rem]:grid-cols-1 max-[52rem]:gap-(--space-1)"><code class="wrap-anywhere font-mono text-caption text-quiet">{token}</code><span class="block h-(--space-4) w-(--preview-space) bg-action" style={`--preview-space: var(${token})`}></span></li>
      {/each}
    </ul>
  </section>
</main>
