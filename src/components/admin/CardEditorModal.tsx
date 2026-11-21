import { Flame } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { CARD_TEXT_MAX_LENGTH, CARD_TEXT_MIN_LENGTH } from '../../features/cards/constants'
import type { CardDraft } from '../../features/cards/api/cardsApi'
import { CATEGORIES, CATEGORY_META } from '../../features/game/data/categories'
import type { Category, Prompt } from '../../features/game/types/game.types'
import { CATEGORY_THEME } from '../game/categoryTheme'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface CardEditorModalProps {
  /** The card being edited, or null when creating a new one. */
  card: Prompt | null
  /** Category to preselect for a new card (follows the active filter). */
  defaultCategory: Category
  /** Resolves to an error message to show, or null once saved. */
  onSave: (draft: CardDraft) => Promise<string | null>
  onClose: () => void
  /** Overrides for reuse, e.g. reviewing a guest suggestion. */
  title?: string
  saveLabel?: string
}

export function CardEditorModal({ card, defaultCategory, onSave, onClose, title, saveLabel }: CardEditorModalProps) {
  const [category, setCategory] = useState<Category>(card?.category ?? defaultCategory)
  const [text, setText] = useState(card?.text ?? '')
  const [spicy, setSpicy] = useState(card?.spicy ?? false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const textId = useId()

  const trimmedLength = text.trim().length
  const canSave = trimmedLength >= CARD_TEXT_MIN_LENGTH && trimmedLength <= CARD_TEXT_MAX_LENGTH && !pending

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave) return
    setPending(true)
    setError(null)
    const failure = await onSave({ category, text: text.trim(), spicy })
    if (failure) {
      setError(failure)
      setPending(false)
    }
  }

  return (
    <Modal title={title ?? (card ? 'Edit card' : 'New card')} onClose={onClose}>
      <form onSubmit={(event) => void submit(event)} className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-mist">Category</legend>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map((option) => {
              const theme = CATEGORY_THEME[option]
              const isSelected = option === category
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setCategory(option)}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border font-display text-sm font-bold transition active:scale-95 ${
                    isSelected ? theme.selected : 'border-white/10 bg-ink/50 text-mist hover:bg-white/10'
                  }`}
                >
                  <theme.Icon aria-hidden className="size-5" />
                  {CATEGORY_META[option].label}
                </button>
              )
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor={textId} className="mb-1.5 block text-sm font-semibold text-mist">
            Card text
          </label>
          <textarea
            id={textId}
            rows={4}
            value={text}
            maxLength={CARD_TEXT_MAX_LENGTH}
            onChange={(event) => setText(event.target.value)}
            placeholder="Short and standalone. Nobody should need context."
            className="w-full resize-none rounded-2xl border border-white/15 bg-ink px-4 py-3 text-lg leading-snug text-paper placeholder:text-mist/70"
          />
          <p className="mt-1 text-right text-xs text-mist">
            {text.length}/{CARD_TEXT_MAX_LENGTH}
          </p>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={spicy}
          onClick={() => setSpicy((value) => !value)}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
            spicy ? 'border-hot/60 bg-hot/10' : 'border-white/10 bg-ink/50 hover:bg-white/10'
          }`}
        >
          <Flame aria-hidden className={`size-6 shrink-0 ${spicy ? 'text-hot' : 'text-mist'}`} />
          <span className="flex-1">
            <span className="block font-display font-bold">Spicy</span>
            <span className="block text-sm text-mist">Only shown when Turn up the heat is on.</span>
          </span>
          <span
            aria-hidden
            className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${spicy ? 'bg-hot' : 'bg-white/15'}`}
          >
            <span
              className={`absolute top-1 left-1 size-6 rounded-full bg-paper shadow transition-transform ${spicy ? 'translate-x-6' : ''}`}
            />
          </span>
        </button>

        {error && (
          <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1" disabled={!canSave}>
            {pending ? 'Saving…' : (saveLabel ?? (card ? 'Save changes' : 'Add card'))}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
