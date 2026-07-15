import { listContent } from "@lunacea/content";
export const prerender = true;
export function load() {
  return {
    groups: [
      { kind: "photos", label: "Photographs", entries: listContent("photo") },
      { kind: "places", label: "Places", entries: listContent("place") },
      { kind: "wines", label: "Wines", entries: listContent("wine") },
      { kind: "moments", label: "Moments", entries: listContent("moment") },
    ],
  };
}
