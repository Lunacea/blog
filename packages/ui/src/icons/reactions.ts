import type { Component } from "svelte";
import type { ReactionKind } from "@lunacea/schemas";
import HeartIcon from "./HeartIcon.svelte";
import LeafIcon from "./LeafIcon.svelte";
import LightbulbIcon from "./LightbulbIcon.svelte";

export const reactionIcons: Record<ReactionKind, Component> = {
  useful: LightbulbIcon,
  inspiring: LeafIcon,
  love: HeartIcon,
};
