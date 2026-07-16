<script lang="ts">
  import type { ContentStatus } from "@lunacea/schemas";
  let { status }: { status: ContentStatus } = $props();
  const labels: Record<ContentStatus, string> = {
    stable: "Stable",
    growing: "Growing",
    fragment: "Fragment",
    deprecated: "Deprecated"
  };
</script>

<span data-status={status}>{labels[status]}</span>

<style>
  span {
    display: inline-flex;
    align-items: center;
    min-height: 1.75rem;
    border-left: 2px solid var(--color-secondary);
    padding-inline: var(--space-2);
    color: var(--color-muted);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
  }

  span[data-status="growing"] {
    border-color: var(--color-accent);
  }

  span[data-status="deprecated"] {
    border-color: var(--color-negative);
  }
</style>
