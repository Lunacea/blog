import { cn } from "../utils.ts";

export type ActionVariant = "default" | "primary" | "ghost" | "outline" | "icon";

const actionVariantClasses: Record<ActionVariant, string> = {
  default: "border-rule bg-panel text-ink hover:border-ink hover:bg-ink hover:text-canvas",
  primary:
    "border-action bg-action text-canvas hover:border-signal hover:bg-signal hover:text-black",
  ghost: "border-transparent bg-transparent text-quiet hover:bg-ink hover:text-canvas",
  outline: "border-rule bg-canvas text-quiet hover:border-ink hover:bg-ink hover:text-canvas",
  icon: "border-transparent bg-transparent p-0 text-quiet hover:bg-ink hover:text-canvas",
};

export function actionVariants(variant: ActionVariant = "default", className = ""): string {
  return cn(
    "inline-flex min-h-control items-center justify-center gap-2 rounded-sharp border px-3 font-interface text-(length:--text-small) no-underline transition-colors duration-(--motion-duration-fast) ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal disabled:cursor-wait disabled:opacity-70 [&>svg]:shrink-0 [&>svg]:text-(length:--text-small)",
    actionVariantClasses[variant],
    variant === "icon" && "size-control",
    className,
  );
}
