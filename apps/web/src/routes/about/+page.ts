import { redirect } from "@sveltejs/kit";
export const prerender = false;
export function load({ url }) {
  redirect(308, `/${url.search}#about`);
}
