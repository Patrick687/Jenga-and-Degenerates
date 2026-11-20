import { Search } from 'lucide-react'
import { useId } from 'react'
import { CATEGORIES, CATEGORY_META } from '../../features/game/data/categories'
import type { CardFilters, CategoryFilter, HeatFilter } from '../../features/cards/utils/cardFilters'
import { CATEGORY_THEME } from '../game/categoryTheme'

interface CardFiltersProps {
  filters: CardFilters
  onChange: (filters: CardFilters) => void
}

const HEAT_OPTIONS: ReadonlyArray<{ value: HeatFilter; label: string }> = [
  { value: 'all', label: 'Any heat' },
  { value: 'mild', label: 'Mild' },
  { value: 'spicy', label: 'Spicy' },
]

const CATEGORY_OPTIONS: ReadonlyArray<{ value: CategoryFilter; label: string; selected: string }> = [
  { value: 'all', label: 'All', selected: 'border-paper bg-paper text-ink' },
  ...CATEGORIES.map((category) => ({
    value: category,
    label: CATEGORY_META[category].label,
    selected: CATEGORY_THEME[category].selected,
  })),
]

const chip = (isSelected: boolean, selectedClasses: string) =>
  `min-h-11 flex-1 rounded-xl border px-3 font-display text-sm font-bold transition active:scale-95 ${
    isSelected ? selectedClasses : 'border-white/10 bg-plum text-mist hover:bg-white/10 hover:text-paper'
  }`

export function CardFiltersBar({ filters, onChange }: CardFiltersProps) {
  const searchId = useId()

  return (
    <div className="space-y-3">
      <div role="group" aria-label="Filter by category" className="flex gap-2">
        {CATEGORY_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.category === option.value}
            onClick={() => onChange({ ...filters, category: option.value })}
            className={chip(filters.category === option.value, option.selected)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div role="group" aria-label="Filter by heat" className="flex gap-2">
        {HEAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filters.heat === option.value}
            onClick={() => onChange({ ...filters, heat: option.value })}
            className={chip(filters.heat === option.value, 'border-hot bg-hot/20 text-hot')}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <label htmlFor={searchId} className="sr-only">
          Search cards
        </label>
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-mist" />
        <input
          id={searchId}
          type="search"
          placeholder="Search cards"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
          className="min-h-12 w-full rounded-2xl border border-white/10 bg-plum pr-4 pl-12 text-paper placeholder:text-mist"
        />
      </div>
    </div>
  )
}
