import type { Preview } from "@storybook/svelte-vite";
import { MINIMAL_VIEWPORTS } from "storybook/viewport";
import "../src/foundations/global.css";
import "./preview.css";

const projectViewports = {
  narrowMobile: {
    name: "Narrow mobile",
    styles: { width: "320px", height: "720px" },
    type: "mobile",
  },
  mobile: {
    name: "Mobile",
    styles: { width: "412px", height: "915px" },
    type: "mobile",
  },
  tablet: {
    name: "Tablet",
    styles: { width: "768px", height: "1024px" },
    type: "tablet",
  },
  desktop: {
    name: "Desktop",
    styles: { width: "1280px", height: "900px" },
    type: "desktop",
  },
  wideDesktop: {
    name: "Wide desktop",
    styles: { width: "1600px", height: "1000px" },
    type: "desktop",
  },
} as const;

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Semantic color theme",
      toolbar: {
        icon: "contrast",
        items: [
          { value: "light", title: "Light" },
          { value: "dark", title: "Dark" },
        ],
        dynamicTitle: true,
      },
    },
    motion: {
      description: "Requested motion level (platform limits still apply)",
      toolbar: {
        icon: "timer",
        items: [
          { value: "full", title: "Full" },
          { value: "reduced", title: "Reduced" },
          { value: "off", title: "Off" },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: "light",
    motion: "reduced",
    viewport: { value: "desktop", isRotated: false },
  },
  parameters: {
    a11y: {
      test: "error",
      config: {
        // Component stories are fragments, so page-level document structure is out of scope.
        rules: [
          { id: "landmark-one-main", enabled: false },
          { id: "page-has-heading-one", enabled: false },
          { id: "region", enabled: false },
        ],
      },
    },
    controls: { expanded: true },
    layout: "padded",
    viewport: {
      options: { ...MINIMAL_VIEWPORTS, ...projectViewports },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme === "dark" ? "dark" : "light";
      const requestedMotion = ["full", "reduced", "off"].includes(context.globals.motion)
        ? context.globals.motion
        : "reduced";
      const platformLimited = matchMedia("(prefers-reduced-motion: reduce)").matches ||
        matchMedia("(forced-colors: active)").matches ||
        (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
      const motion = requestedMotion === "off"
        ? "off"
        : (requestedMotion === "reduced" || platformLimited ? "reduced" : "full");

      localStorage.setItem("lunacea-theme", theme);
      localStorage.setItem("lunacea-motion", requestedMotion);
      document.documentElement.dataset.themePreference = theme;
      document.documentElement.dataset.theme = theme;
      document.documentElement.dataset.motionPreference = requestedMotion;
      document.documentElement.dataset.motion = motion;
      document.documentElement.style.colorScheme = theme;
      dispatchEvent(new CustomEvent("lunacea:theme"));
      dispatchEvent(new CustomEvent("lunacea:motion"));
      return Story();
    },
  ],
};

export default preview;
