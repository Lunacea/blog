// 記事のメタデータ (Frontmatter) 定義
export interface Frontmatter {
  title: string;
  date: string;
  tags: string[];
  description?: string;
  syncToQiita?: boolean;
  syncToZenn?: boolean;
}

// MDX解析後のデータ構造
export interface ParsedPost {
  slug: string;
  metadata: Frontmatter;
  htmlContent: string;
  hasCustomUI: boolean;
}

// コメントデータ構造
export interface Comment {
  id: string;
  postId: string;
  name: string;
  content: string;
  createdAt: string;
}

// Zenn/Qiitaへの同期履歴ログ
export interface SyncLog {
  id: string;
  slug: string;
  platform: "zenn" | "qiita";
  status: "success" | "failed";
  message: string;
  timestamp: string;
}
