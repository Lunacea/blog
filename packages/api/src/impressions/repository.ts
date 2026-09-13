/** 記事ごとの公開カウンタ。利用者・端末・リクエストの情報は一切保存しない。 */
export interface ImpressionRepository {
  /** 同一の匿名利用者が期間内に記録済みでなければ1件記録する。 */
  record(contentId: string, actorId: string, now?: Date): Promise<number>;
  counts(contentIds: readonly string[]): Promise<Record<string, number>>;
}
