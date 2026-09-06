<script lang="ts">
  import Icon from "./Icon.svelte";

  let { filled = false }: { filled?: boolean } = $props();
</script>

<Icon name={filled ? "solar:heart-bold" : "solar:heart-linear"} />
