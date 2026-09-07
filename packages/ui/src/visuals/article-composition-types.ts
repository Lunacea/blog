export type CompositionVisualBlock = {
  kind: "text" | "technical" | "media";
  start: number;
  end: number;
  units: number;
  characters: number;
};
export type CompositionVisualSection = { id: string; start: number; end: number; units: number };
export type ArticleCompositionVisual = {
  estimatedMinutes: number;
  textCharacters: number;
  paperLayers: number;
  blocks: readonly CompositionVisualBlock[];
  sections: readonly CompositionVisualSection[];
};
