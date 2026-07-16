export const siteConfig = {
  name: "Lunacea",
  title: "Lunacea — code, research, and quiet records",
  description: "人のいなくなった近未来建築に、コード、研究、写真、土地の記憶を残す個人アーカイブ。",
  url: "https://blog.lunacea.jp",
  language: "ja",
  sampleMode: true,
  author: {
    name: "Lunacea",
    github: "https://github.com/Lunacea",
  },
  defaultLocation: {
    id: "morioka-jp",
    name: "盛岡",
    region: "岩手県",
    country: "日本",
    latitude: 39.7036,
    longitude: 141.1527,
    timezone: "Asia/Tokyo",
  },
  reactions: [
    { id: "useful", label: "参考になった" },
    { id: "inspiring", label: "刺激を受けた" },
    { id: "love", label: "好き" },
  ],
} as const;

export const primaryNavigation = [
  { href: "/articles", label: "Articles" },
  { href: "/works", label: "Works" },
  { href: "/talks", label: "Talks" },
  { href: "/archive", label: "Archive" },
  { href: "/about", label: "About" },
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
    src: null,
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
    src: null,
    alt: "Lunaceaのプロフィール写真",
    width: 960,
    height: 1200,
    aspectRatio: "4 / 5",
    objectPosition: "50% 38%",
    mobileObjectPosition: "50% 30%",
    variant: "portrait",
    loading: "lazy",
    opacity: 0.92,
    allowMotion: false,
    placeholder: {
      assetId: "profile-portrait",
      role: "プロフィール画像",
      preferredFileType: "AVIF/WebP",
      accessibilityDescription: "人物と撮影状況を簡潔に説明する",
      transparencyRequired: false,
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
      role: "ホームヒーローのauthored media",
      preferredFileType: "AVIF/WebP",
      accessibilityDescription: "装飾画像のため空のaltを維持する",
      transparencyRequired: true,
    },
  },
} as const satisfies Record<string, AuthoredMedia>;
