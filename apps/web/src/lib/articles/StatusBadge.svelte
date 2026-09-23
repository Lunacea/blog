<script lang="ts">
  import type { ContentStatus } from "@lunacea/schemas";
  import { contentStatusLabel } from "./content-labels.ts";
  import { Badge } from "@lunacea/ui/primitives";
  let { status }: { status: ContentStatus } = $props();

  const variant = $derived(status === "growing" ? "accent" : status === "deprecated" ? "negative" : "outline");
</script>

<Badge {variant} class="status-badge">{contentStatusLabel(status)}</Badge>
