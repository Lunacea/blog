import { redirect } from "@sveltejs/kit";

export const prerender = false;

export function load({ url }) {
  const query = new URLSearchParams();
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 120);
  const tag = url.searchParams.get("tag")?.trim();
  if (q) query.set("q", q);
  if (tag) query.set("tag", tag);
  if (url.searchParams.get("type") === "talk") query.set("category", "talk");
  redirect(308, `/articles${query.size ? `?${query}` : ""}`);
}
