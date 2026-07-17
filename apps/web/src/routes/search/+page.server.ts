import { redirect } from "@sveltejs/kit";
import { articleCategorySchema } from "@lunacea/schemas";

export const prerender = false;

export function load({ url }) {
  const query = new URLSearchParams();
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const tag = url.searchParams.get("tag")?.trim();
  const category = articleCategorySchema.safeParse(url.searchParams.get("category"));
  const sort = url.searchParams.get("sort");
  const view = url.searchParams.get("view");
  if (q) query.set("q", q);
  if (tag) query.set("tag", tag);
  if (category.success) query.set("category", category.data);
  else if (url.searchParams.get("type") === "talk") query.set("category", "talk");
  if (sort === "relevance" || sort === "published" || sort === "updated") query.set("sort", sort);
  if (view === "grid" || view === "list") query.set("view", view);
  redirect(308, `/articles${query.size ? `?${query}` : ""}`);
}
