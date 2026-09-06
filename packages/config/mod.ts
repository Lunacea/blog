export const siteConfig = {
  name: "Lunacea",
  title: "Lunacea — Web, UX & Design",
  description:
    "UI・UX設計、Webエンジニアリング、グラフィックデザイン。設計と実装の考え方を綴る技術ブログ。",
  url: "https://blog.lunacea.jp",
  language: "ja",
  sampleMode: true,
  author: {
    name: "Lunacea",
    github: "https://github.com/Lunacea",
    x: "https://x.com/_Lunacea",
    email: "dev@lunacea.jp",
  },
  featuredArticleTags: [],
  catalogFilters: {
    articles: { categories: [], tags: [] },
  },
  /** Representative stack shown under the Home introduction; icons resolve by name. */
  techStack: ["TypeScript", "Svelte", "SvelteKit", "Deno", "Three.js", "Design"],
  defaultLocation: {
    id: "morioka-jp",
    name: "盛岡",
    region: "岩手県",
    country: "日本",
    latitude: 39.7036,
    longitude: 141.1527,
    timezone: "Asia/Tokyo",
  },
} as const;

export const primaryNavigation = [
  { href: "/", label: "Home" },
  { href: "/articles", label: "Articles" },
] as const;

export type AuthoredMedia = {
  src: string | null;
  sources?: ReadonlyArray<{
    srcset: string;
    type: "image/avif" | "image/webp";
    media?: string;
  }>;
  alt: string;
  width: number;
  height: number;
  aspectRatio: string;
  objectPosition: string;
  mobileObjectPosition?: string;
  variant: "identity" | "portrait" | "organic" | "editorial";
  loading: "eager" | "lazy";
  opacity: number;
  allowMotion: boolean;
  placeholder: {
    assetId: string;
    role: string;
    preferredFileType: "AVIF/WebP" | "SVG/PNG";
    accessibilityDescription: string;
    transparencyRequired: boolean;
  };
};

/**
 * Authored media is intentionally empty in sample mode. Replace these values with
 * owned AVIF/WebP assets; the UI never synthesizes people, plants, or identity art.
 */
export const visualAssets = {
  identity: {
    src: "/images/Lunacea-nobg.png",
    alt: "",
    width: 256,
    height: 256,
    aspectRatio: "1 / 1",
    objectPosition: "50% 50%",
    variant: "identity",
    loading: "eager",
    opacity: 1,
    allowMotion: false,
    placeholder: {
      assetId: "identity-mark",
      role: "サイト識別子",
      preferredFileType: "SVG/PNG",
      accessibilityDescription: "装飾なら空のalt、文字やロゴを含む場合は内容を説明する",
      transparencyRequired: true,
    },
  },
  profile: {
    src: "/images/Lunacea-nobg.png",
    alt: "黄色いウーパールーパーと魚の中間のキャラクター",
    width: 960,
    height: 960,
    aspectRatio: "1 / 1",
    objectPosition: "50% 50%",
    mobileObjectPosition: "50% 50%",
    variant: "organic",
    loading: "lazy",
    opacity: 0.92,
    allowMotion: false,
    placeholder: {
      assetId: "profile-creature-crescent-v1",
      role: "三日月状の構図を持つプロフィールキャラクター",
      preferredFileType: "AVIF/WebP",
      accessibilityDescription: "黄色いウーパールーパーと魚の中間のキャラクターを簡潔に説明する",
      transparencyRequired: true,
    },
  },
  heroOrganic: {
    src: null,
    alt: "",
    width: 720,
    height: 960,
    aspectRatio: "3 / 4",
    objectPosition: "50% 100%",
    mobileObjectPosition: "65% 100%",
    variant: "organic",
    loading: "eager",
    opacity: 0.44,
    allowMotion: true,
    placeholder: {
      assetId: "home-hero-organic",
      role: "ホーム上部から自然に伸びる透過foliage",
      preferredFileType: "AVIF/WebP",
      accessibilityDescription: "装飾の葉なので空のaltを維持する",
      transparencyRequired: true,
    },
  },
} as const satisfies Record<string, AuthoredMedia>;
