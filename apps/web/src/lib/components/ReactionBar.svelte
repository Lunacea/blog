<script lang="ts">
  import { onMount } from "svelte";
  import { ReactionControl } from "$ui/components";
  import {
    reactionSummarySchema,
    type Content,
    type ReactionSummary
  } from "@lunacea/schemas";

  let { content }: { content: Content } = $props();
  let summary = $state<ReactionSummary | null>(null);
  let pending = $state(false);
  let message = $state("");
  let celebrate = $state(0);

  const endpoint = $derived("/api/v1/reactions/" + content.type + "/" + content.slug);

  async function load() {
    try {
      const response = await fetch(endpoint);
      summary = reactionSummarySchema.parse(await response.json());
    } catch {
      message = "称賛数を読み込めませんでした";
    }
  }

  async function toggle() {
    if (!summary || pending) return;
    const active = !summary.selected;
    // The count answers the press immediately; the server response reconciles it.
    const previous = summary;
    summary = {
      ...summary,
      selected: active,
      count: Math.max(0, summary.count + (active ? 1 : -1)),
    };
    pending = true;
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error("reaction failed");
      summary = reactionSummarySchema.parse(await response.json());
      if (active) celebrate += 1;
      message = active ? "称賛しました" : "称賛を取り消しました";
    } catch {
      summary = previous;
      message = "称賛を更新できませんでした";
    } finally {
      pending = false;
    }
  }

  onMount(() => void load());
</script>

<ReactionControl
  count={summary?.count ?? 0}
  selected={summary?.selected ?? false}
  {pending}
  disabled={!summary}
  {message}
  {celebrate}
  ontoggle={() => void toggle()}
/>
