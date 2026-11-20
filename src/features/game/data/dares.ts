import type { Prompt } from '../types/game.types'
import { createPrompts } from '../utils/promptHelpers'

// IDs are generated from position: append new prompts to the END to keep IDs stable.
export const darePrompts: Prompt[] = createPrompts('dare', false, [
  'Give someone across the room your best seductive eye contact for 10 seconds.',
  'Recreate your dating-app profile photos for the group.',
  'Give your best runway walk across the room.',
  'Let the group give you a ridiculous nickname for the rest of the night.',
  'Do an affectionate impression of someone in the room. They have to guess who.',
  "Dramatically perform a text you've sent, or one you make up, in your most theatrical voice.",
  'Give a 30-second acceptance speech for an award you absolutely do not deserve.',
  'Let the group choose an emoji you must use in your next three texts.',
  'Seductively describe an object within reach.',
  'Show the group your best flirting technique.',
  'Give a dramatic breakup speech to an object in the room.',
  "Speak in an accent of the group's choosing until your next prompt.",
  "Give someone a compliment as if you're a Victorian poet.",
  'Recreate the way you act when you see someone attractive.',
  'Make up a new dance move and teach it to the group.',
  'Do your best thirst-trap pose for the camera. No photo required.',
  "Pretend you're campaigning for president and explain why you're the hottest candidate.",
  'Be the sports commentator for the next Jenga pull. Championship-level energy only.',
  'Propose to a houseplant, a lamp, or a Jenga block. Make it emotional.',
  'Deliver the weather forecast like a flirty news anchor.',
  'Walk in slow motion like you just stepped out of a perfume ad.',
  "Whisper a boring fact like it's the hottest thing anyone has ever heard.",
  'Give a reality-show confessional about the Jenga tower. Name your alliances.',
  'Hand out a flattering award to everyone in the room, like Most Likely to Steal the Aux.',
  'Pitch a dating app for Jenga blocks. Name it and sell it.',
  'Give turn-by-turn GPS directions to your own heart.',
])
