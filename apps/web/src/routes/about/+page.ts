import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types.d.ts";

export const prerender = false;
export const load: PageLoad = ({ url }) => {
  redirect(308, `/${url.search}#about`);
};
