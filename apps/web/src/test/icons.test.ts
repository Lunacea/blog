import { describe, expect, it } from "vitest";
import { interfaceIcons, socialIcons, tagIconName } from "$ui/icons/index.ts";

describe("semantic icon resolution", () => {
  it("maps interface and versioned technology labels", () => {
    expect(interfaceIcons.search).toBe("solar:magnifer-linear");
    expect(socialIcons.github).toBe("simple-icons:github");
    expect(socialIcons.x).toBe("simple-icons:x");
    expect(socialIcons.email).toBe("solar:letter-linear");
    expect(tagIconName("SvelteKit")).toBe("simple-icons:svelte");
    expect(tagIconName("Svelte 5")).toBe("simple-icons:svelte");
    expect(tagIconName("Deno 2")).toBe("simple-icons:deno");
    expect(tagIconName("Three.js")).toBe("simple-icons:threedotjs");
    expect(tagIconName("Threlte")).toBe("solar:code-linear");
    expect(tagIconName("Research")).toBe("solar:tag-linear");
  });
});
