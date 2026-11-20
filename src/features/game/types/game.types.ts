export type Category = 'truth' | 'dare' | 'chaos'

/** What the player has selected. `random` draws from every category. */
export type Mode = Category | 'random'

export interface Prompt {
  /** Stable identifier, used to track which prompts have been shown. */
  id: string
  category: Category
  text: string
  /** Only served when Spicy Mode is enabled. */
  spicy: boolean
}

export interface HistoryEntry {
  /** Unique per draw (the same prompt can appear again after a pool reset). */
  id: string
  promptId: string
  category: Category
  text: string
  spicy: boolean
  /** Epoch milliseconds. */
  timestamp: number
  passed: boolean
}

/** The slice of game state that is saved to localStorage. */
export interface PersistedGameState {
  version: 1
  mode: Mode
  spicy: boolean
  usedIds: string[]
  history: HistoryEntry[]
}
