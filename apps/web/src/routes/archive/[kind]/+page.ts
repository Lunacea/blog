import { error, redirect } from "@sveltejs/kit";

const kinds = new Set(["diaries", "photos", "places", "wines", "moments"]);
export const prerender = false;
export function load({ params }) {
  if (!kinds.has(params.kind)) error(404, "Archive kind not found");
  redirect(308, `/archive?kind=${params.kind}`);
}
