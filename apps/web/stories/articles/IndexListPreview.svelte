<script lang="ts">
  import IndexList from "$lib/articles/IndexList.svelte";
  import type { IndexEntry } from "$lib/articles/index-entry.ts";

  let { entries, label, bleed = false }: {
    entries: readonly IndexEntry[];
    label: string;
    bleed?: boolean | "compact";
  } = $props();
</script>

<!-- 一覧が収まるページ枠。compact はこの gutter の分だけ外へはみ出す。 -->
<div class="mx-auto w-full max-w-content px-(--layout-gutter) py-(--space-10)">
  <IndexList {entries} {label} {bleed} />
</div>
