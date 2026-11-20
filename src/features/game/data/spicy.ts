import type { Prompt } from '../types/game.types'
import { createPrompts } from '../utils/promptHelpers'

// Served only when Spicy Mode is on. Flirty and suggestive, never explicit,
// and nobody has to touch anyone or share anything private.
// IDs are generated from position: append new prompts to the END to keep IDs stable.

export const spicyTruthPrompts: Prompt[] = createPrompts('truth', true, [
  "Who here would you most like to be stuck in an elevator with, and why?",
  "What's the boldest flirting move you've ever seen or pulled off?",
  "What's the most attractive thing someone can do on a run?",
  "What's your most 'did that really just happen?' dating-app moment?",
  "What's your type, in exactly three words?",
  "What's the sexiest thing someone can do while playing a video game?",
  "What attractive trait do you only notice after getting to know someone?",
  "Short shorts or running tights: which is more dangerous to the club's focus? Defend it.",
  "What's the last thing that made you blush?",
  "What's your best first-kiss story? Setting only, no names.",
])

export const spicyDarePrompts: Prompt[] = createPrompts('dare', true, [
  "Give someone a smoldering look for 5 seconds. They rate it from 1 to 10.",
  "Say a pickup line to the person on your left with a completely straight face.",
  "Compliment the person across from you like a thirst-trap caption writer.",
  "Say a sultry line in your best Mario voice. Commit.",
  "Strike three influencer poses. The group picks the best one.",
  "Describe the person on your right using only dating-profile clichés.",
  "Tell someone here what you'd write on their dating profile.",
  "Blow a kiss to the room like you just won an Oscar.",
  "Show your most confident flirting face. The room votes: 'yes' or 'try again.'",
  "Do your sexiest finish-line pose. The group scores it.",
])

export const spicyChaosPrompts: Prompt[] = createPrompts('chaos', true, [
  "Everyone votes: who has the best style here? The winner takes applause.",
  "Everyone points at who is most likely to start a relationship through run club.",
  "Group vote: who's the biggest flirt here? The winner shares one flirting tip.",
  "Everyone shares the most embarrassing thing they've said while flirting.",
  "Everyone rates their own flirting skills from 1 to 10, then the group re-rates them.",
  "Vote on the best wingman and who needs the most help. Both tell a story.",
  "Everyone finishes: 'The most romantic thing about this club is...'",
  "Everyone names their celebrity crush at once on three. Cheer for matches.",
  "Everyone gets one compliment from the person on their left. No repeats.",
  "Group guess: who here has the most unread dating-app messages? They confirm or deny.",
])

export const spicyPrompts: Prompt[] = [
  ...spicyTruthPrompts,
  ...spicyDarePrompts,
  ...spicyChaosPrompts,
]
