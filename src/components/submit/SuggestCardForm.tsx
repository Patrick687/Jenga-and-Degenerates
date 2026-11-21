import { Check, Flame, Send } from 'lucide-react'
import { useId, useState, type FormEvent } from 'react'
import { CATEGORY_THEME } from '../game/categoryTheme'
import { Button } from '../ui/Button'
import { CARD_TEXT_MAX_LENGTH, CARD_TEXT_MIN_LENGTH } from '../../features/cards/constants'
import { CATEGORIES, CATEGORY_META } from '../../features/game/data/categories'
import type { Category } from '../../features/game/types/game.types'
import { submitCard } from '../../features/submissions/api/submissionsApi'
import { GraphQLRequestError } from '../../lib/graphql'

/** The suggestion form with its own thank-you state. Used by the /submit page and the in-game popup. */
export function SuggestCardForm() {
  const [category, setCategory] = useState<Category>('truth')
  const [text, setText] = useState('')
  const [spicy, setSpicy] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(0)
  const textId = useId()

  const length = text.trim().length
  const canSend = length >= CARD_TEXT_MIN_LENGTH && length <= CARD_TEXT_MAX_LENGTH && !pending

  const send = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSend) return
    setPending(true)
    setError(null)
    try {
      await submitCard({ category, text: text.trim(), spicy })
      setText('')
      setSpicy(false)
      setSent((count) => count + 1)
    } catch (caught) {
      setError(caught instanceof GraphQLRequestError ? caught.message : 'Something went wrong. Try again.')
    } finally {
      setPending(false)
    }
  }

  if (sent > 0 && text === '' && !error) {
    return (
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-hot/15 text-hot">
          <Check aria-hidden className="size-8" />
        </span>
        <p className="font-display text-2xl font-bold">Added to the deck</p>
        <p className="max-w-sm text-mist">It's live. Pull a block and you might get it. Keep them coming.</p>
        <Button variant="primary" size="lg" className="w-full max-w-sm" onClick={() => setSent(0)}>
          Add another
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={(event) => void send(event)} className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-mist">Category</legend>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((option) => {
            const theme = CATEGORY_THEME[option]
            const selected = option === category
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                onClick={() => setCategory(option)}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-2xl border font-display text-sm font-bold transition active:scale-95 ${
                  selected ? theme.selected : 'border-white/10 bg-ink/50 text-mist hover:bg-white/10'
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
          Your card
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

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={!canSend}
        icon={<Send aria-hidden className="size-5" />}
      >
        {pending ? 'Adding…' : 'Add to the deck'}
      </Button>
    </form>
  )
}
