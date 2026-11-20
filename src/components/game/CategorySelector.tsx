import { Shuffle, type LucideIcon } from 'lucide-react'
import { CATEGORIES, CATEGORY_META } from '../../features/game/data/categories'
import type { Mode } from '../../features/game/types/game.types'
import { CATEGORY_THEME } from './categoryTheme'

interface Option {
  mode: Mode
  label: string
  Icon: LucideIcon
  selected: string
}

const OPTIONS: readonly Option[] = [
  { mode: 'random', label: 'Random', Icon: Shuffle, selected: 'border-paper bg-paper text-ink' },
  ...CATEGORIES.map((category) => ({
    mode: category,
    label: CATEGORY_META[category].label,
    Icon: CATEGORY_THEME[category].Icon,
    selected: CATEGORY_THEME[category].selected,
  })),
]

interface CategorySelectorProps {
  mode: Mode
  onChange: (mode: Mode) => void
}

export function CategorySelector({ mode, onChange }: CategorySelectorProps) {
  return (
    <div role="group" aria-label="Game mode" className="grid grid-cols-4 gap-2">
      {OPTIONS.map((option) => {
        const isSelected = option.mode === mode
        return (
          <button
            key={option.mode}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.mode)}
            className={`flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 font-display text-sm font-bold transition active:scale-95 ${
              isSelected
                ? option.selected
                : 'border-white/10 bg-plum text-mist hover:bg-white/10 hover:text-paper'
            }`}
          >
            <option.Icon aria-hidden className="size-5" />
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
