const roots = ["apps/web/src", "packages/ui/src", "packages/config"];
const sourceExtensions = new Set([".css", ".svelte", ".ts"]);
const themePath = "packages/ui/src/foundations/theme.css";
const findings: string[] = [];

async function* walk(path: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(path)) {
    const child = `${path}/${entry.name}`;
    if (entry.isDirectory) yield* walk(child);
    else if (sourceExtensions.has(child.slice(child.lastIndexOf(".")))) yield child;
  }
}

function report(path: string, line: number, message: string) {
  findings.push(`${path}:${line}: ${message}`);
}

function hasReason(lines: string[], index: number): boolean {
  return lines[index]?.includes("design-literal:") || lines[index - 1]?.includes("design-literal:");
}

for (const root of roots) {
  for await (const path of walk(root)) {
    const source = await Deno.readTextFile(path);
    const lines = source.split("\n");

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      if (path !== themePath && /#[0-9a-fA-F]{3,8}\b/.test(line) && !hasReason(lines, index)) {
        report(path, lineNumber, "raw color must be defined in foundations/theme.css");
      }
      if (
        path !== themePath &&
        /^\s*--(?:color|font|text|weight|leading|tracking|space|radius|shadow|motion|breakpoint)-[\w-]+\s*:/
          .test(line)
      ) {
        report(
          path,
          lineNumber,
          "reusable theme values may only be declared in foundations/theme.css",
        );
      }
      if (
        /(?:font-size|font-weight|line-height|border-radius|animation-duration|transition-duration):\s*-?(?:\d|\.\d)/
          .test(line) &&
        !hasReason(lines, index)
      ) {
        report(path, lineNumber, "raw typography, radius, or duration requires a token");
      }
      if (/z-index:\s*-?\d/.test(line) && !hasReason(lines, index)) {
        report(path, lineNumber, "raw stacking value requires a token");
      }
      if (
        /box-shadow:/.test(line) &&
        !/box-shadow:\s*(?:var\(|none\b)/.test(line) &&
        !hasReason(lines, index)
      ) {
        report(path, lineNumber, "raw shadow requires a token");
      }
      if (
        /(?:^|\s)(?:gap|padding(?:-[\w]+)?|margin(?:-[\w]+)?):[^;]*\b\d*\.?\d+(?:px|rem)\b/.test(
          line,
        ) &&
        !hasReason(lines, index)
      ) {
        report(path, lineNumber, "raw spacing requires a token or a design-literal reason");
      }
      const widthBreakpoint = line.match(/\((?:min|max)-width:\s*([\d.]+rem)\)/)?.[1];
      if (widthBreakpoint && !["34rem", "44rem", "52rem", "60rem"].includes(widthBreakpoint)) {
        report(path, lineNumber, "width breakpoint is outside the registered Tailwind scale");
      }
      if (/[←→↑↓↗↘↙↖★☆✦]/u.test(line) || /\p{Extended_Pictographic}/u.test(line)) {
        report(path, lineNumber, "emoji and Unicode icon substitutes are not allowed in UI source");
      }
    });

    if (/from\s+["'](?:lucide|@lucide|@tabler|@phosphor|react-icons)/.test(source)) {
      report(path, 1, "unapproved icon library import");
    }
    if (
      /from\s+["']@iconify/.test(source) && !path.startsWith("packages/ui/src/icons/")
    ) {
      report(path, 1, "Iconify imports must stay inside packages/ui/src/icons");
    }
    if (/from\s+["']bits-ui["']/.test(source) && !path.startsWith("packages/ui/src/primitives/")) {
      report(path, 1, "Bits UI imports must stay inside packages/ui/src/primitives");
    }
    if (/\$ui\/[A-Z][^"']+\.svelte/.test(source)) {
      report(path, 1, "application code must use public UI barrels or owned subpaths");
    }
  }
}

const legacyTheme = await Deno.stat("packages/tokens").then(() => true).catch(() => false);
if (legacyTheme) findings.push("packages/tokens: legacy theme package must be removed");

if (findings.length) {
  console.error("Design-system check failed:\n" + findings.map((item) => `- ${item}`).join("\n"));
  Deno.exit(1);
}

console.log("Design-system boundaries and token usage validated.");
