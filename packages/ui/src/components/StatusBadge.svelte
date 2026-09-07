<script lang="ts">
  import type { ContentStatus } from "@lunacea/schemas";
  import { contentStatusLabel } from "./content-labels.ts";
  import Badge from "../primitives/Badge.svelte";
  let { status }: { status: ContentStatus } = $props();

  const variant = $derived(status === "growing" ? "accent" : status === "deprecated" ? "negative" : "outline");
</script>

<Badge {variant} class="status-badge">{contentStatusLabel(status)}</Badge>
