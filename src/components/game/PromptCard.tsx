import { Check, Copy, Flame, Share2 } from 'lucide-react'
import { CATEGORY_META } from '../../features/game/data/categories'
import type { HistoryEntry } from '../../features/game/types/game.types'
import { getPromptSizeClass } from '../../features/game/utils/promptHelpers'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { IconButton } from '../ui/IconButton'
import { CATEGORY_THEME } from './categoryTheme'

const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

export function PromptCard({ entry }: { entry: HistoryEntry }) {
  const meta = CATEGORY_META[entry.category]
  const theme = CATEGORY_THEME[entry.category]
  const { copied, copy } = useCopyToClipboard()
  const shareText = `${meta.label.toUpperCase()}: ${entry.text}`

  const share = async () => {
    try {
      await navigator.share({ title: '29 & UNHINGED', text: shareText })
    } catch {
      // The share sheet was dismissed. Nothing to do.
    }
  }

  return (
    // Keyed by entry ID so every new prompt replays the entrance animation.
    <article
      key={entry.id}
      aria-label={`${meta.label} prompt`}
      className={`relative animate-card-in overflow-hidden rounded-[2rem] border bg-plum p-6 sm:p-8 ${theme.card}`}
    >
      <div aria-hidden className={`absolute -top-24 -right-20 size-64 rounded-full blur-3xl ${theme.blob}`} />
      <theme.Icon
        aria-hidden
        className={`absolute -right-6 -bottom-8 size-48 rotate-12 opacity-[0.07] ${theme.text}`}
      />

      <div className="relative flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-display text-sm font-bold tracking-[0.2em] uppercase ${theme.pill}`}
        >
          <theme.Icon aria-hidden className="size-4" />
          {meta.label}
        </span>
        {entry.spicy && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/50 bg-hot/15 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-hot uppercase">
            <Flame aria-hidden className="size-3.5" />
            Spicy
          </span>
        )}
      </div>

      {/* aria-live so screen readers announce each new prompt. */}
      <p
        aria-live="polite"
        className={`relative my-8 animate-text-in font-display leading-[1.12] font-bold tracking-tight text-balance ${getPromptSizeClass(entry.text)}`}
      >
        {entry.text}
      </p>

      <div className="relative flex items-center justify-between gap-3">
        <p className={`font-display text-sm font-semibold tracking-[0.14em] uppercase ${theme.text}`}>
          {meta.tagline}
        </p>
        <div className="flex gap-2">
          <IconButton label={copied ? 'Copied' : 'Copy prompt'} onClick={() => void copy(shareText)}>
            {copied ? <Check aria-hidden className="size-5 text-tangerine" /> : <Copy aria-hidden className="size-5" />}
          </IconButton>
          {canShare && (
            <IconButton label="Share prompt" onClick={() => void share()}>
              <Share2 aria-hidden className="size-5" />
            </IconButton>
          )}
        </div>
      </div>
    </article>
  )
}
