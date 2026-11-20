import type { Prompt } from '../types/game.types'
import { chaosPrompts } from './chaos'
import { darePrompts } from './dares'
import { spicyPrompts } from './spicy'
import { truthPrompts } from './truths'

export const ALL_PROMPTS: readonly Prompt[] = [
  ...truthPrompts,
  ...darePrompts,
  ...chaosPrompts,
  ...spicyPrompts,
]
