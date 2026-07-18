<script lang="ts">
  import type { ContentStatus } from "@lunacea/schemas";
  import { contentStatusLabel } from "./content-labels.ts";
  let { status }: { status: ContentStatus } = $props();
</script>

<span class="status-badge" data-status={status}>{contentStatusLabel(status)}</span>

<style>
  span {
    display: inline-flex;
    align-items: center;
    min-height: var(--space-8);
    border: 1px solid var(--color-secondary);
    padding-inline: var(--space-2);
    color: var(--color-muted);
    font-family: var(--font-sans);
    font-size: var(--text-caption);
  }

  span[data-status="growing"] {
    border-color: var(--color-accent);
    color: var(--color-accent);
  }

  span[data-status="deprecated"] {
    border-color: var(--color-negative);
    color: var(--color-negative);
  }
</style>
