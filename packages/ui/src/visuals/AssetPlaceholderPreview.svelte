<script lang="ts">
  import AssetPlaceholder from "./AssetPlaceholder.svelte";

  let {
    assetId,
    role,
    aspectRatio,
    preferredFileType,
    accessibilityDescription,
    transparencyRequired,
  }: {
    assetId: string;
    role: string;
    aspectRatio: string;
    preferredFileType: string;
    accessibilityDescription: string;
    transparencyRequired: boolean;
  } = $props();
</script>

<div class="aspect-(--preview-ratio) w-[min(100%,36rem)]" style={`--preview-ratio: ${aspectRatio}`}>
  <AssetPlaceholder
    {assetId}
    {role}
    {aspectRatio}
    {preferredFileType}
    {accessibilityDescription}
    {transparencyRequired}
  />
</div>
