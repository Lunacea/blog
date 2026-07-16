import { redirect } from "@sveltejs/kit";
export const prerender = false;
export function load() {
  redirect(308, "/articles?category=talk");
}
