export function stableFeedPath(canonicalPath: string, legacyPaths: readonly string[]): string {
  return legacyPaths.find((path) => path.startsWith("/talks/")) ?? canonicalPath;
}
