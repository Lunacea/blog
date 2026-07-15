import type { ReactionKind, ReactionSummary } from "@lunacea/schemas";

export interface ReactionRepository {
  get(contentId: string, actorId: string): Promise<ReactionSummary>;
  set(
    contentId: string,
    actorId: string,
    kind: ReactionKind,
    active: boolean,
  ): Promise<ReactionSummary>;
  consume(actorId: string, now?: Date): Promise<boolean>;
}
