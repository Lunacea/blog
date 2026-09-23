import type { Meta, StoryObj } from "@storybook/sveltekit";
import ProfileCard from "$lib/home/ProfileCard.svelte";

const meta = {
  title: "Home/ProfileCard",
  component: ProfileCard,
  parameters: { layout: "centered" },
  args: {
    name: "Lunacea",
    role: "UI / UX Design — Web Engineering",
    bio: "UIデザインとWeb開発を中心に、設計から実装までを手がけています。",
    github: "https://github.com/example",
    x: "https://x.com/example",
    email: "hello@example.com",
    class: "max-w-(--profile-card-print)",
  },
} satisfies Meta<typeof ProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The card as Home carries it: draggable, with the contact row below the identity. */
export const Default: Story = {};
/** Without a bio the card keeps its ratio and the identity simply sits higher. */
export const WithoutBio: Story = { args: { bio: undefined } };
/** A single contact still fills the row rather than leaving it ragged. */
export const SingleContact: Story = { args: { x: undefined, email: undefined } };
export const Dark: Story = { globals: { theme: "dark" } };
/** With motion off the card neither tilts nor springs; dragging is simply disabled. */
export const MotionOff: Story = { globals: { motion: "off" } };
