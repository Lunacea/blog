<script lang="ts">
  import { onMount } from "svelte";
  import { HeartIcon } from "$ui/icons";
  import { Button } from "$ui/primitives";
  import {
    reactionSummarySchema,
    type Content,
    type ReactionSummary
  } from "@lunacea/schemas";

  let { content }: { content: Content } = $props();
  let summary = $state<ReactionSummary | null>(null);
  let pending = $state(false);
  let message = $state("");

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
    pending = true;
    try {
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active })
      });
      if (!response.ok) throw new Error("reaction failed");
      summary = reactionSummarySchema.parse(await response.json());
      message = active ? "称賛しました" : "称賛を取り消しました";
    } catch {
      message = "称賛を更新できませんでした";
    } finally {
      pending = false;
    }
  }

  onMount(() => void load());
</script>

<section class="reactions" aria-label="称賛" data-reveal>
  <Button
    class="praise"
    variant="ghost"
    disabled={!summary || pending}
    aria-pressed={summary?.selected ?? false}
    aria-label={summary?.selected ? "称賛を取り消す" : "称賛する"}
    onclick={() => void toggle()}
  >
    <HeartIcon filled={summary?.selected ?? false} />
    <strong>{summary?.count ?? 0}</strong>
  </Button>
  <p class="status" aria-live="polite">{message}</p>
</section>

<style>
  .reactions {
    display: flex;
    align-items: center;
  }

  :global(.praise) {
    position: relative;
    min-width: var(--space-16);
    min-height: var(--space-10);
    justify-content: center;
    border: 1px solid var(--color-line);
    padding-inline: var(--space-3);
    background: var(--color-background);
    color: var(--color-muted);
  }

  :global(.praise[aria-pressed="true"]) {
    border-color: var(--color-accent);
    background: transparent;
    color: var(--color-accent);
  }

  :global(.praise:hover:not(:disabled):not([aria-pressed="true"])),
  :global(.praise:focus-visible:not([aria-pressed="true"])) {
    border-color: var(--color-accent);
    color: var(--color-black);
    background: var(--color-accent);
  }

  :global(.praise[aria-pressed="true"]:hover:not(:disabled)),
  :global(.praise[aria-pressed="true"]:focus-visible) {
    border-color: var(--color-accent);
    background: transparent;
    color: var(--color-accent);
  }

  strong {
    font-size: var(--text-caption);
    font-variant-numeric: tabular-nums;
  }

  :global(.praise svg) {
    flex: none;
    font-size: var(--text-h3);
    transform-origin: center;
  }

  :global(.praise:hover:not(:disabled) svg) {
    animation: praise-heart-hover var(--motion-duration-base)
      var(--motion-ease-standard) infinite alternate;
  }

  :global(.praise[aria-pressed="true"]:not(:disabled) svg) {
    animation: praise-heart-select var(--motion-duration-base)
      var(--motion-ease-enter) both;
  }

  :global(.praise::after) {
    position: absolute;
    inset: 24%;
    border: 1px solid transparent;
    border-radius: var(--radius-round);
    content: "";
    pointer-events: none;
  }

  :global(.praise[aria-pressed="true"]::after) {
    animation: praise-burst var(--motion-duration-base)
      var(--motion-ease-enter) both;
  }

  .status {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  @keyframes praise-heart-hover {
    to {
      transform: scale(1.12);
    }
  }

  @keyframes praise-heart-select {
    0% {
      transform: scale(0.72);
    }
    58% {
      transform: scale(1.28);
    }
    100% {
      transform: scale(1);
    }
  }

  @keyframes praise-burst {
    0% {
      border-color: var(--color-accent);
      opacity: 0.9;
      transform: scale(0.4);
    }
    100% {
      border-color: var(--color-accent);
      opacity: 0;
      transform: scale(2.5);
    }
  }
</style>
