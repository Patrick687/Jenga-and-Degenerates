import type { Category, Prompt } from '../../game/types/game.types'

export type CategoryFilter = Category | 'all'
export type HeatFilter = 'all' | 'mild' | 'spicy'

export interface CardFilters {
  category: CategoryFilter
  heat: HeatFilter
  query: string
}

export const DEFAULT_FILTERS: CardFilters = { category: 'all', heat: 'all', query: '' }

export function filterCards(cards: readonly Prompt[], filters: CardFilters): Prompt[] {
  const query = filters.query.trim().toLowerCase()
  return cards.filter((card) => {
    if (filters.category !== 'all' && card.category !== filters.category) return false
    if (filters.heat === 'spicy' && !card.spicy) return false
    if (filters.heat === 'mild' && card.spicy) return false
    return query === '' || card.text.toLowerCase().includes(query)
  })
}

export interface CardCounts {
  total: number
  truth: number
  dare: number
  chaos: number
  spicy: number
}

export function countCards(cards: readonly Prompt[]): CardCounts {
  const counts: CardCounts = { total: cards.length, truth: 0, dare: 0, chaos: 0, spicy: 0 }
  for (const card of cards) {
    counts[card.category] += 1
    if (card.spicy) counts.spicy += 1
  }
  return counts
}
