import type { Prompt } from '../types/game.types'
import { createPrompts } from '../utils/promptHelpers'

// Served only when Spicy Mode is on. Flirty and suggestive, never explicit,
// and never dependent on anyone's orientation, gender, or relationship status.
// IDs are generated from position: append new prompts to the END to keep IDs stable.

export const spicyTruthPrompts: Prompt[] = createPrompts('truth', true, [
  "What's the most chaotic place you've ever kissed someone?",
  "What's your most embarrassing hookup story? Edit as needed.",
  "What's a turn-on that would surprise this room?",
  "What's the best kiss you've ever had, and what made it work?",
  "What's your most shameless flirting move, and has it ever actually worked?",
  "What's a fantasy you'd be comfortable sharing with this room?",
  "What's the most awkward thing that's happened mid-makeout?",
  "What's the most memorable thing someone has said to flirt with you?",
  "What's the most obvious sign someone was into you that you totally missed?",
  "What's a weirdly small thing someone did that made you instantly attracted to them?",
  "What's your boldest move at a bar, club, or party, and did it land?",
  "What dating trope from queer culture have you absolutely lived through?",
])

export const spicyDarePrompts: Prompt[] = createPrompts('dare', true, [
  'Give your best bedroom-voice reading of a recipe, a weather report, or a terms-of-service agreement.',
  'Slow-dance with an imaginary partner like the song is about you.',
  'Give someone a compliment so smooth it sounds like a pickup line. They can fake-swoon.',
  'Strike three poses for a very sultry perfume ad.',
  'Eat a snack like it is a steamy movie scene. Pretend if there is no snack.',
  'Deliver your best pickup line to a Jenga block.',
  'Have a 10-second will-they-won\'t-they stare-off with someone who is up for it.',
  'Pitch yourself as the hot guest star in the finale of a steamy reality show.',
  'Serenade someone with an improvised love song. Get their OK first, then go extremely dramatic.',
  "Deliver your best \"come here often?\" to the group like it's absolutely going to work.",
  "Do your \"I'm wearing nothing but confidence\" walk. Fully clothed, obviously.",
  'Describe your ideal first kiss like a nature documentary narrator.',
])

export const spicyChaosPrompts: Prompt[] = createPrompts('chaos', true, [
  'Group vote: who here gives the best kisser energy?',
  'Everyone who has ever sent a flirty text to the wrong person raises their hand.',
  'Everyone points to who they would most want to get stuck in an elevator with.',
  'Group vote: who is the biggest flirt in the room?',
  'Everyone shares the worst pickup line they have ever heard. The group crowns a winner.',
  'Everyone describes their type in three words.',
  'Pick two people who are up for it to recreate a steamy-movie almost-kiss. PG-13 only.',
  "Group vote: who's the best wingperson in the room?",
  'Everyone who has ever had a crush on a friend raises their hand. No names.',
  'Choose someone to rate your flirting from 1 to 10 and give you one tip.',
  'Everyone shares their most embarrassing flirting fail in exactly one sentence.',
  'Everyone rates their own rizz from 1 to 10, all at once, on three.',
])

export const spicyPrompts: Prompt[] = [
  ...spicyTruthPrompts,
  ...spicyDarePrompts,
  ...spicyChaosPrompts,
]
