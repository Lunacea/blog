import type { ReactionSummary } from "@lunacea/schemas";

export interface ReactionRepository {
  get(contentId: string, actorId: string): Promise<ReactionSummary>;
  set(contentId: string, actorId: string, active: boolean): Promise<ReactionSummary>;
  consume(actorId: string, now?: Date): Promise<boolean>;
}
