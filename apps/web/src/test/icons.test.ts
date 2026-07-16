import { describe, expect, it } from "vitest";
import { interfaceIcons, tagIconName, weatherIconName } from "$ui/icons/index.ts";

describe("semantic icon resolution", () => {
  it("maps interface and versioned technology labels", () => {
    expect(interfaceIcons.search).toBe("solar:magnifer-linear");
    expect(tagIconName("SvelteKit")).toBe("simple-icons:svelte");
    expect(tagIconName("Svelte 5")).toBe("simple-icons:svelte");
    expect(tagIconName("Deno 2")).toBe("simple-icons:deno");
    expect(tagIconName("Three.js")).toBe("simple-icons:threedotjs");
    expect(tagIconName("Threlte")).toBe("solar:code-linear");
    expect(tagIconName("Research")).toBe("solar:tag-linear");
  });

  it("maps every weather state and phase", () => {
    expect(weatherIconName("clear", "day")).toBe("solar:sun-2-linear");
    expect(weatherIconName("clear", "night")).toBe("solar:moon-linear");
    expect(weatherIconName("cloudy", "night")).toBe("solar:cloudy-moon-linear");
    expect(weatherIconName("fog", "day")).toBe("solar:fog-linear");
    expect(weatherIconName("rain", "day")).toBe("solar:cloud-rain-linear");
    expect(weatherIconName("snow", "day")).toBe("solar:cloud-snowfall-linear");
    expect(weatherIconName("storm", "day")).toBe("solar:cloud-storm-linear");
    expect(weatherIconName("unknown", "day")).toBe("solar:clock-circle-linear");
  });
});
