<script lang="ts">
  let {
    assetId,
    role,
    aspectRatio,
    preferredFileType,
    accessibilityDescription,
    transparencyRequired
  }: {
    assetId: string;
    role: string;
    aspectRatio: string;
    preferredFileType: string;
    accessibilityDescription: string;
    transparencyRequired: boolean;
  } = $props();

  const accessibleName = $derived(`${role}用の画像プレースホルダー。アセットID ${assetId}`);
</script>

<div class="relative grid size-full place-items-end border border-rule bg-[linear-gradient(135deg,transparent_49.8%,var(--color-line)_50%,transparent_50.2%),color-mix(in_srgb,var(--color-surface)_56%,transparent)] before:absolute before:inset-(--space-5) before:border before:border-rule before:content-['']" role="img" aria-label={accessibleName}>
  <dl class="relative m-(--space-3) grid max-w-[calc(100%-var(--space-6))] gap-(--space-1) bg-canvas p-(--space-2) font-mono text-caption tracking-label text-quiet [&>div]:grid [&>div]:grid-cols-[4.5rem_minmax(0,1fr)] [&>div]:gap-(--space-2) [&_dt]:wrap-anywhere [&_dt]:text-ink [&_dt]:uppercase [&_dd]:m-0 [&_dd]:wrap-anywhere">
    <div><dt>Asset</dt><dd>{assetId}</dd></div>
    <div><dt>Role</dt><dd>{role}</dd></div>
    <div><dt>Ratio</dt><dd>{aspectRatio}</dd></div>
    <div><dt>File</dt><dd>{preferredFileType}</dd></div>
    <div><dt>Alt</dt><dd>{accessibilityDescription}</dd></div>
    <div><dt>Alpha</dt><dd>{transparencyRequired ? "Required" : "Not required"}</dd></div>
  </dl>
</div>
