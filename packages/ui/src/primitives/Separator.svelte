<script lang="ts">
  import { Separator } from "bits-ui";
  import { cn } from "../utils.ts";

  let {
    orientation = "horizontal",
    decorative = true,
    class: className = "",
  }: {
    orientation?: "horizontal" | "vertical";
    decorative?: boolean;
    class?: string;
  } = $props();
</script>

<Separator.Root
  {orientation}
  {decorative}
  class={cn(
    "shrink-0 bg-rule data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
    className,
  )}
/>
