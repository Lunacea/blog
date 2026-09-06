<script lang="ts">
  import { Button, Input } from "./index.ts";
  import * as Collapsible from "./collapsible/index.ts";
  import * as ToggleGroup from "./toggle-group/index.ts";

  let selected = $state(["research"]);
</script>

<main class="grid gap-12">
  <section class="grid gap-4 border-t border-rule pt-4" aria-labelledby="buttons-heading">
    <h2 class="m-0 font-editorial text-(length:--text-h3) font-regular" id="buttons-heading">Button</h2>
    <div class="flex flex-wrap gap-2">
      <Button>Default</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button disabled>Pending</Button>
    </div>
  </section>

  <section class="grid gap-4 border-t border-rule pt-4" aria-labelledby="fields-heading">
    <h2 class="m-0 font-editorial text-(length:--text-h3) font-regular" id="fields-heading">Native fields</h2>
    <div class="grid max-w-xl grid-cols-[minmax(8rem,.35fr)_minmax(0,1fr)] items-center gap-3 max-sm:grid-cols-1 [&>label]:text-(length:--text-small) [&>label]:text-quiet">
      <label for="preview-input">Input</label>
      <Input id="preview-input" value="盛岡" />
      <label for="preview-query">Query variant</label>
      <Input id="preview-query" variant="query" value="静かな記録" />
    </div>
  </section>

  <section class="grid gap-4 border-t border-rule pt-4" aria-labelledby="disclosure-heading">
    <h2 class="m-0 font-editorial text-(length:--text-h3) font-regular" id="disclosure-heading">Collapsible</h2>
    <Collapsible.Root class="max-w-xl">
      <Collapsible.Trigger class="min-h-control cursor-pointer border border-rule bg-panel px-3 text-ink data-[state=open]:border-signal data-[state=open]:bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))]">詳細を表示</Collapsible.Trigger>
      <Collapsible.Content class="border border-t-0 border-rule p-4 text-quiet">
        ネイティブの読み順を保ちながら、開閉状態とARIAをBits UIが管理します。
      </Collapsible.Content>
    </Collapsible.Root>
  </section>

  <section class="grid gap-4 border-t border-rule pt-4" aria-labelledby="toggle-heading">
    <h2 class="m-0 font-editorial text-(length:--text-h3) font-regular" id="toggle-heading">Toggle group</h2>
    <ToggleGroup.Root
      class="flex flex-wrap gap-2 **:data-[slot=toggle-group-item]:min-h-control **:data-[slot=toggle-group-item]:cursor-pointer **:data-[slot=toggle-group-item]:border **:data-[slot=toggle-group-item]:border-rule **:data-[slot=toggle-group-item]:bg-panel **:data-[slot=toggle-group-item]:px-3 **:data-[slot=toggle-group-item]:text-ink [&_[data-slot=toggle-group-item][data-state=on]]:border-signal [&_[data-slot=toggle-group-item][data-state=on]]:bg-[color-mix(in_srgb,var(--color-accent)_10%,var(--color-surface))]"
      type="multiple"
      value={selected}
      onValueChange={(value) => selected = value}
      aria-label="記録の分類"
    >
      <ToggleGroup.Item value="research">Research</ToggleGroup.Item>
      <ToggleGroup.Item value="design">Design</ToggleGroup.Item>
      <ToggleGroup.Item value="archive">Archive</ToggleGroup.Item>
    </ToggleGroup.Root>
    <p class="m-0 min-h-6 font-code text-(length:--text-small) text-quiet" aria-live="polite">Selected: {selected.join(", ") || "none"}</p>
  </section>
</main>
