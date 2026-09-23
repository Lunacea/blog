const preloadModules = import.meta.glob(
  [
    "../.generated/fonts/archivo.*.woff2",
    "../.generated/fonts/zen-700.*.woff2",
  ],
  { eager: true, query: "?url", import: "default" },
) as Record<string, string>;

export const fontPreloads = Object.values(preloadModules);
