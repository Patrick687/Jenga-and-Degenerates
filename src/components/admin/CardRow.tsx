import { Flame, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { CATEGORY_META } from '../../features/game/data/categories'
import type { Prompt } from '../../features/game/types/game.types'
import { IconButton } from '../ui/IconButton'
import { CATEGORY_THEME } from '../game/categoryTheme'

interface CardRowProps {
  card: Prompt
  /** Briefly highlight and scroll to this row (used right after saving). */
  highlighted: boolean
  onEdit: (card: Prompt) => void
  onDelete: (card: Prompt) => void
}

export function CardRow({ card, highlighted, onEdit, onDelete }: CardRowProps) {
  const theme = CATEGORY_THEME[card.category]
  const rowRef = useRef<HTMLLIElement>(null)

  useEffect(() => {
    if (highlighted) rowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [highlighted])

  return (
    <li
      ref={rowRef}
      className={`flex items-stretch gap-2 rounded-2xl border bg-plum transition-colors ${
        highlighted ? 'border-hot shadow-[0_0_30px_-8px_rgba(244,90,167,0.7)]' : 'border-white/10'
      }`}
    >
      <button
        type="button"
        onClick={() => onEdit(card)}
        aria-label={`Edit ${CATEGORY_META[card.category].label} card: ${card.text}`}
        className="min-w-0 flex-1 rounded-2xl p-4 text-left transition hover:bg-white/5 active:scale-[0.99]"
      >
        <span className="mb-1.5 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
          <span className={`inline-flex items-center gap-1.5 ${theme.text}`}>
            <theme.Icon aria-hidden className="size-3.5" />
            {CATEGORY_META[card.category].label}
          </span>
          {card.spicy && (
            <span className="inline-flex items-center gap-1 text-hot">
              <Flame aria-hidden className="size-3.5" />
              Spicy
            </span>
          )}
        </span>
        <span className="block text-base leading-snug">{card.text}</span>
      </button>
      <div className="flex items-center pr-3">
        <IconButton label={`Delete card: ${card.text}`} onClick={() => onDelete(card)}>
          <Trash2 aria-hidden className="size-5" />
        </IconButton>
      </div>
    </li>
  )
}
