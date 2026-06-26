import { ParsedPost } from "../../shared/types.ts";

export class PostManager {
  private kv: Deno.Kv;

  constructor(kv: Deno.Kv) {
    this.kv = kv;
  }

  async savePost(post: ParsedPost): Promise<void> {
    await this.kv.set(["posts", post.slug], post);
  }

  async getPost(slug: string): Promise<ParsedPost | null> {
    const res = await this.kv.get<ParsedPost>(["posts", slug]);
    return res.value;
  }

  async deletePost(slug: string): Promise<void> {
    await this.kv.delete(["posts", slug]);
  }
}
