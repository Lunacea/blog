<script lang="ts">
  import { page } from "$app/state";
</script>

<svelte:head><title>{page.status} — Lunacea</title></svelte:head>

<div class="page shell">
  <p class="eyebrow">Signal lost / {page.status}</p>
  <h1 class="page-title">{page.status === 404 ? "Record not found" : "Unexpected condition"}</h1>
  <p class="lead">{page.error?.message ?? "要求された資料を表示できませんでした。"}</p>
  <p><a href="/">入口へ戻る</a></p>
</div>
