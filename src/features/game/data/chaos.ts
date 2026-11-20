import type { Prompt } from '../types/game.types'
import { createPrompts } from '../utils/promptHelpers'

// IDs are generated from position: append new prompts to the END to keep IDs stable.
export const chaosPrompts: Prompt[] = createPrompts('chaos', false, [
  'Everyone who has ever ghosted someone raises their hand.',
  'Pick someone to tell you their first impression of you.',
  'Everyone points to the person most likely to accidentally get married in Vegas.',
  'Choose two people to have a 15-second compliment battle.',
  'Everyone votes on who in the room would survive longest on reality TV.',
  'Choose someone to invent a new handshake with you.',
  'Everyone reveals their most-used emoji.',
  'Group vote: who here has the worst taste in people?',
  'Pick someone to swap seats with.',
  'Everyone who has ever had a situationship raises their hand.',
  'The group gives you a new fake job title.',
  'Pick two people to act out a romantic movie scene.',
  'Everyone shares their most irrational pet peeve.',
  'Choose someone to give you a fake horoscope.',
  'Group vote: who here would make the best sugar daddy or sugar mommy?',
  'Pick someone to be your hype person for the next round.',
  'Everyone gives the birthday person one word describing them.',
  'The group creates a backstory for the person who just pulled.',
  'Everyone says their celebrity crush out loud on three, all at once.',
  'Group vote: who here would start a cult by accident?',
  'Everyone names their go-to karaoke song. The group picks one to hum together.',
  'Pick someone to write your dating-app bio in one sentence.',
  'Group vote: who would last longest in a haunted house before bailing?',
  'Everyone shares the zodiac stereotype that is most embarrassingly accurate for them.',
  'Choose someone to be your life coach for the next 60 seconds. Ask them anything.',
  'Everyone names the villain alter ego they would have on a reality show.',
])
