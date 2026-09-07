<script lang="ts">
  import { ToggleGroup as ToggleGroupPrimitive } from "bits-ui";

  let { ref = $bindable(null), ...restProps }: ToggleGroupPrimitive.ItemProps = $props();
</script>

<ToggleGroupPrimitive.Item bind:ref data-slot="toggle-group-item" {...restProps} />
