import type { Category } from '../game/types/game.types'

/** A card a guest suggested, waiting for the host. */
export interface Submission {
  id: string
  category: Category
  text: string
  spicy: boolean
  submittedBy: string | null
}
