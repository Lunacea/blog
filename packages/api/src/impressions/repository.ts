/** Impressions are a public per-article counter. No actor, device or request data is stored. */
export interface ImpressionRepository {
  /** Records one impression unless this anonymous actor already recorded it inside the window. */
  record(contentId: string, actorId: string, now?: Date): Promise<number>;
  counts(contentIds: readonly string[]): Promise<Record<string, number>>;
}
