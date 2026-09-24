<script lang="ts">
  import type { ContentStatus } from "@lunacea/schemas";
  import { aiWrittenLabel, contentStatusLabel } from "./content-labels.ts";
  import { Badge } from "@lunacea/ui/primitives";
  let { status, aiWritten = false }: { status: ContentStatus; aiWritten?: boolean } = $props();

  const variant = $derived(
    aiWritten ? "outline" : status === "growing" ? "accent" : status === "deprecated" ? "negative" : "outline",
  );
</script>

<Badge {variant} class="status-badge">{aiWritten ? aiWrittenLabel : contentStatusLabel(status)}</Badge>
