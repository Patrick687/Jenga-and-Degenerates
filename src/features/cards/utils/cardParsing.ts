import type { Category, Prompt } from '../../game/types/game.types'

export type ApiCategory = 'TRUTH' | 'DARE' | 'CHAOS'

const FROM_API: Record<ApiCategory, Category> = { TRUTH: 'truth', DARE: 'dare', CHAOS: 'chaos' }
const TO_API: Record<Category, ApiCategory> = { truth: 'TRUTH', dare: 'DARE', chaos: 'CHAOS' }

export function toApiCategory(category: Category): ApiCategory {
  return TO_API[category]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isApiCategory(value: unknown): value is ApiCategory {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(FROM_API, value)
}

function isCategory(value: unknown): value is Category {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(TO_API, value)
}

/** Validates one card from the API (uppercase categories) and converts it to the game's Prompt shape. */
export function parseApiCard(value: unknown): Prompt | null {
  if (!isRecord(value)) return null
  const { id, category, text, spicy } = value
  if (typeof id !== 'string' || id === '' || !isApiCategory(category)) return null
  if (typeof text !== 'string' || text.trim() === '' || typeof spicy !== 'boolean') return null
  return { id, category: FROM_API[category], text, spicy }
}

export function parseApiCards(value: unknown): Prompt[] {
  if (!Array.isArray(value)) return []
  return value.map(parseApiCard).filter((card): card is Prompt => card !== null)
}

/** Validates cards read back from localStorage (already in the game's shape). */
export function parseCachedPrompts(raw: unknown): Prompt[] | null {
  if (!isRecord(raw) || raw.version !== 1 || !Array.isArray(raw.prompts)) return null
  const prompts: Prompt[] = []
  for (const item of raw.prompts) {
    if (!isRecord(item)) return null
    const { id, category, text, spicy } = item
    if (typeof id !== 'string' || !isCategory(category)) return null
    if (typeof text !== 'string' || text.trim() === '' || typeof spicy !== 'boolean') return null
    prompts.push({ id, category, text, spicy })
  }
  return prompts.length > 0 ? prompts : null
}
