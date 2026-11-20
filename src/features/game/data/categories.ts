import type { Category } from '../types/game.types'

export const CATEGORIES: readonly Category[] = ['truth', 'dare', 'chaos']

export const CATEGORY_META: Record<Category, { label: string; tagline: string }> = {
  truth: { label: 'Truth', tagline: 'Expose yourself.' },
  dare: { label: 'Dare', tagline: 'Commit to the bit.' },
  chaos: { label: 'Chaos', tagline: 'Everyone is involved.' },
}
