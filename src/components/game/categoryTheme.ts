import { Eye, Tornado, Zap, type LucideIcon } from 'lucide-react'
import type { Category } from '../../features/game/types/game.types'

interface CategoryTheme {
  Icon: LucideIcon
  /** Accent text color. */
  text: string
  /** Card border + glow. */
  card: string
  /** Pill behind the category label. */
  pill: string
  /** Soft blurred blob inside the card. */
  blob: string
  /** Selected state for the mode selector. */
  selected: string
}

// Full class names are written out so Tailwind can see them at build time.
export const CATEGORY_THEME: Record<Category, CategoryTheme> = {
  truth: {
    Icon: Eye,
    text: 'text-grape',
    card: 'border-grape/50 shadow-[0_0_90px_-24px_rgba(167,139,250,0.65)]',
    pill: 'border-grape/50 bg-grape/15 text-grape',
    blob: 'bg-grape/30',
    selected: 'border-grape bg-grape text-ink',
  },
  dare: {
    Icon: Zap,
    text: 'text-hot',
    card: 'border-hot/50 shadow-[0_0_90px_-24px_rgba(244,90,167,0.65)]',
    pill: 'border-hot/50 bg-hot/15 text-hot',
    blob: 'bg-hot/30',
    selected: 'border-hot bg-hot text-ink',
  },
  chaos: {
    Icon: Tornado,
    text: 'text-tangerine',
    card: 'border-tangerine/50 shadow-[0_0_90px_-24px_rgba(255,180,84,0.6)]',
    pill: 'border-tangerine/50 bg-tangerine/15 text-tangerine',
    blob: 'bg-tangerine/30',
    selected: 'border-tangerine bg-tangerine text-ink',
  },
}
