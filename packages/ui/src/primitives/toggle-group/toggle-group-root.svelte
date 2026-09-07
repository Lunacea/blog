<script lang="ts">
  import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: ToggleGroupPrimitive.RootProps = $props();
</script>

<ToggleGroupPrimitive.Root bind:ref data-slot="toggle-group-root" {...restProps} />
