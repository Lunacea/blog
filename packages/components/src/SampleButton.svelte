<script lang="ts">
  let {
    text = "クリックしてね",
    type = "primary",
  }: {
    text?: string;
    type?: "primary" | "secondary";
  } = $props();

  let count = $state(0);

  const typeClass = $derived(
    type === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-md"
      : "bg-gray-200 text-gray-800 hover:bg-gray-300",
  );

  const baseClass =
    "px-4 py-2 rounded-lg font-bold transition-all transform active:scale-95";
</script>

<button onclick={() => count++} class="{baseClass} {typeClass}">
  {text} (クリック回数: {count})
</button>
