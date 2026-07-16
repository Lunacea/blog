<script lang="ts">
  import { Button, Input, NativeSelect } from "./index.ts";
  import * as Collapsible from "./collapsible/index.ts";
  import * as ToggleGroup from "./toggle-group/index.ts";

  let selected = $state(["research"]);
</script>

<main class="primitives-preview">
  <section aria-labelledby="buttons-heading">
    <h2 id="buttons-heading">Button</h2>
    <div class="row">
      <Button>Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Pending</Button>
    </div>
  </section>

  <section aria-labelledby="fields-heading">
    <h2 id="fields-heading">Native fields</h2>
    <div class="fields">
      <label for="preview-input">Input</label>
      <Input id="preview-input" value="盛岡" />
      <label for="preview-query">Query variant</label>
      <Input id="preview-query" variant="query" value="静かな記録" />
      <label for="preview-select">Select</label>
      <NativeSelect id="preview-select" value="auto">
        <option value="auto">Auto</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </NativeSelect>
    </div>
  </section>

  <section aria-labelledby="disclosure-heading">
    <h2 id="disclosure-heading">Collapsible</h2>
    <Collapsible.Root class="preview-collapsible">
      <Collapsible.Trigger class="preview-trigger">詳細を表示</Collapsible.Trigger>
      <Collapsible.Content class="preview-content">
        ネイティブの読み順を保ちながら、開閉状態とARIAをBits UIが管理します。
      </Collapsible.Content>
    </Collapsible.Root>
  </section>

  <section aria-labelledby="toggle-heading">
    <h2 id="toggle-heading">Toggle group</h2>
    <ToggleGroup.Root
      class="preview-toggle-group"
      type="multiple"
      bind:value={selected}
      aria-label="記録の分類"
    >
      <ToggleGroup.Item value="research">Research</ToggleGroup.Item>
      <ToggleGroup.Item value="design">Design</ToggleGroup.Item>
      <ToggleGroup.Item value="archive">Archive</ToggleGroup.Item>
    </ToggleGroup.Root>
    <p class="selection" aria-live="polite">Selected: {selected.join(", ") || "none"}</p>
  </section>
</main>

<style>
  .primitives-preview {
    display: grid;
    gap: var(--space-12);
  }

  section {
    display: grid;
    gap: var(--space-4);
    border-top: 1px solid var(--color-line);
    padding-top: var(--space-4);
  }

  h2 {
    margin: 0;
    font-family: var(--font-serif);
    font-size: var(--text-h3);
    font-weight: var(--weight-regular);
  }

  .row,
  :global(.preview-toggle-group) {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .fields {
    display: grid;
    max-width: 36rem;
    grid-template-columns: minmax(8rem, 0.35fr) minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3);
  }

  label,
  .selection {
    color: var(--color-muted);
    font-size: var(--text-small);
  }

  :global(.preview-collapsible) {
    max-width: 36rem;
  }

  :global(.preview-trigger),
  :global(.preview-toggle-group [data-slot="toggle-group-item"]) {
    min-height: var(--control-size);
    border: 1px solid var(--color-line);
    padding-inline: var(--space-3);
    background: var(--color-surface);
    color: var(--color-foreground);
    cursor: pointer;
  }

  :global(.preview-trigger[data-state="open"]),
  :global(.preview-toggle-group [data-state="on"]) {
    border-color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, var(--color-surface));
  }

  :global(.preview-content) {
    border: 1px solid var(--color-line);
    border-top: 0;
    padding: var(--space-4);
    color: var(--color-muted);
  }

  .selection {
    min-height: var(--space-6);
    margin: 0;
    font-family: var(--font-mono);
  }

  @media (max-width: 44rem) {
    .fields {
      grid-template-columns: 1fr;
    }
  }
</style>
