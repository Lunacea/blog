import type { Content } from "@lunacea/schemas";
import { contentId } from "@lunacea/schemas";

export function relatedContent(
  target: Content,
  candidates: Content[],
  limit = 3,
): Content[] {
  const manual = new Set(target.related);
  return candidates
    .filter((candidate) => contentId(candidate) !== contentId(target))
    .map((candidate) => ({
      candidate,
      score: (manual.has(contentId(candidate)) ? 100 : 0) +
        candidate.tags.filter((tag) => target.tags.includes(tag)).length * 10 +
        (candidate.type === target.type ? 2 : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) =>
      right.score - left.score ||
      right.candidate.publishedAt.localeCompare(left.candidate.publishedAt)
    )
    .slice(0, limit)
    .map((entry) => entry.candidate);
}
