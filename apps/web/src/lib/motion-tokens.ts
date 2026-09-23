/** モーションのトークンを実行時に読む。値は tokens.css が持ち、ここには書かない。 */

const style = () => getComputedStyle(document.documentElement);

/** `--motion-duration-<name>` をミリ秒で返す。s と ms のどちらの書き方でも読む。 */
export function motionDuration(name: string): number {
  const value = style().getPropertyValue(`--motion-duration-${name}`).trim();
  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount)) return 0;
  return value.endsWith("ms") ? amount : value.endsWith("s") ? amount * 1000 : amount;
}

/** `--motion-ease-<name>` を Web Animations に渡せる形で返す。 */
export function motionEasing(name: string): string {
  return style().getPropertyValue(`--motion-ease-${name}`).trim() || "ease";
}
