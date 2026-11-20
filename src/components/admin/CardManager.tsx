import { ArrowLeft, LogOut, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import type { CardDraft } from '../../features/cards/api/cardsApi'
import { useCardManager } from '../../features/cards/hooks/useCardManager'
import { countCards, DEFAULT_FILTERS, filterCards, type CardFilters } from '../../features/cards/utils/cardFilters'
import type { Prompt } from '../../features/game/types/game.types'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { CardEditorModal } from './CardEditorModal'
import { CardFiltersBar } from './CardFilters'
import { CardRow } from './CardRow'
import { DeleteCardModal } from './DeleteCardModal'

type Dialog = { type: 'edit'; card: Prompt | null } | { type: 'delete'; card: Prompt } | null

interface CardManagerProps {
  password: string
  onLogout: () => void
}

export function CardManager({ password, onLogout }: CardManagerProps) {
  const { cards, loadError, save, remove, reload } = useCardManager(password, onLogout)
  const [filters, setFilters] = useState<CardFilters>(DEFAULT_FILTERS)
  const [dialog, setDialog] = useState<Dialog>(null)
  const [highlightedId, setHighlightedId] = useState<string | null>(null)

  const visibleCards = useMemo(() => (cards ? filterCards(cards, filters) : []), [cards, filters])
  const counts = useMemo(() => countCards(cards ?? []), [cards])
  const closeDialog = () => setDialog(null)

  const saveCard = async (draft: CardDraft): Promise<string | null> => {
    const editing = dialog?.type === 'edit' ? dialog.card : null
    const result = await save(draft, editing?.id)
    if (!result.ok) return result.error
    // A saved card might not match the current filters; reset them so it's visible.
    setFilters(DEFAULT_FILTERS)
    setHighlightedId(result.card.id)
    window.setTimeout(() => setHighlightedId(null), 2500)
    closeDialog()
    return null
  }

  const deleteCard = async (card: Prompt): Promise<string | null> => {
    const result = await remove(card.id)
    if (!result.ok) return result.error
    closeDialog()
    return null
  }

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-plum px-4 text-sm font-semibold hover:bg-white/10"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Game
        </Link>
        <IconButton label="Log out" onClick={onLogout}>
          <LogOut aria-hidden className="size-5" />
        </IconButton>
      </header>

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-36">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Card manager</h1>
          <p className="mt-2 text-sm text-mist">
            {cards
              ? `${counts.total} cards · ${counts.truth} truth · ${counts.dare} dare · ${counts.chaos} chaos · ${counts.spicy} spicy`
              : 'Loading the deck…'}
          </p>
        </div>

        <CardFiltersBar filters={filters} onChange={setFilters} />

        {loadError ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-300">
            <p>{loadError}</p>
            <Button onClick={reload}>Try again</Button>
          </div>
        ) : cards === null ? (
          <p className="py-10 text-center text-mist">Loading…</p>
        ) : visibleCards.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-plum p-6 text-center text-mist">
            {cards.length === 0 ? 'No cards yet. Add the first one.' : 'No cards match those filters.'}
          </p>
        ) : (
          <>
            <p aria-live="polite" className="text-sm text-mist">
              Showing {visibleCards.length}
              {visibleCards.length === cards.length ? '' : ` of ${cards.length}`}
            </p>
            <ul className="space-y-3">
              {visibleCards.map((card) => (
                <CardRow
                  key={card.id}
                  card={card}
                  highlighted={card.id === highlightedId}
                  onEdit={(target) => setDialog({ type: 'edit', card: target })}
                  onDelete={(target) => setDialog({ type: 'delete', card: target })}
                />
              ))}
            </ul>
          </>
        )}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink via-ink/95 to-transparent pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-xl px-5">
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            onClick={() => setDialog({ type: 'edit', card: null })}
            icon={<Plus aria-hidden className="size-6" />}
          >
            Add card
          </Button>
        </div>
      </div>

      {dialog?.type === 'edit' && (
        <CardEditorModal
          card={dialog.card}
          defaultCategory={filters.category === 'all' ? 'truth' : filters.category}
          onSave={saveCard}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'delete' && (
        <DeleteCardModal card={dialog.card} onConfirm={() => deleteCard(dialog.card)} onClose={closeDialog} />
      )}
    </>
  )
}
