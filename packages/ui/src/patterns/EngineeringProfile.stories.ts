import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EngineeringProfile from "./EngineeringProfile.svelte";

const categories = [
  {
    title: "Frontend",
    technologies: [
      { label: "SvelteKit", icon: "simple-icons:svelte" },
      { label: "Tailwind CSS", icon: "simple-icons:tailwindcss" },
      { label: "Three.js", icon: "simple-icons:threedotjs" },
    ],
  },
  {
    title: "Backend",
    technologies: [
      { label: "Deno", icon: "simple-icons:deno" },
      { label: "Hono", icon: "solar:code-linear" },
      { label: "Zod", icon: "simple-icons:zod" },
    ],
  },
  {
    title: "Testing / Quality",
    technologies: [
      { label: "Vitest", icon: "simple-icons:vitest" },
      { label: "Playwright", icon: "simple-icons:playwright" },
      { label: "axe-core", icon: "solar:accessibility-linear" },
    ],
  },
] as const;

const meta = {
  title: "Patterns/EngineeringProfile",
  component: EngineeringProfile,
  parameters: { layout: "padded" },
  args: { categories },
} satisfies Meta<typeof EngineeringProfile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DesktopColumns: Story = {};
export const MobileColumns: Story = {
  parameters: { viewport: { defaultViewport: "mobile" } },
};
