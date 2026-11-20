import { useCallback, useEffect, useState } from 'react'
import { GraphQLRequestError } from '../../../lib/graphql'
import type { Prompt } from '../../game/types/game.types'
import { createCard, deleteCard, fetchCards, updateCard, type CardDraft } from '../api/cardsApi'

export type SaveResult = { ok: true; card: Prompt } | { ok: false; error: string }
export type RemoveResult = { ok: true } | { ok: false; error: string }

/** Loads all cards and exposes create / update / remove, keeping the local list in sync. */
export function useCardManager(password: string, onUnauthorized: () => void) {
  const [cards, setCards] = useState<Prompt[] | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadCount, setReloadCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchCards(controller.signal).then(
      (loaded) => {
        setCards(loaded)
        setLoadError(null)
      },
      (error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setLoadError(error instanceof GraphQLRequestError ? error.message : 'Could not load the cards.')
      },
    )
    return () => controller.abort()
  }, [reloadCount])

  const describeFailure = useCallback(
    (error: unknown): string => {
      if (error instanceof GraphQLRequestError) {
        if (error.kind === 'unauthorized') onUnauthorized()
        return error.message
      }
      return 'Something went wrong. Try again.'
    },
    [onUnauthorized],
  )

  const save = useCallback(
    async (draft: CardDraft, id?: string): Promise<SaveResult> => {
      try {
        const card = id ? await updateCard(password, id, draft) : await createCard(password, draft)
        setCards((current) => {
          if (!current) return [card]
          return id ? current.map((existing) => (existing.id === id ? card : existing)) : [...current, card]
        })
        return { ok: true, card }
      } catch (error) {
        return { ok: false, error: describeFailure(error) }
      }
    },
    [password, describeFailure],
  )

  const remove = useCallback(
    async (id: string): Promise<RemoveResult> => {
      try {
        await deleteCard(password, id)
        setCards((current) => current?.filter((card) => card.id !== id) ?? null)
        return { ok: true }
      } catch (error) {
        return { ok: false, error: describeFailure(error) }
      }
    },
    [password, describeFailure],
  )

  const reload = useCallback(() => {
    setLoadError(null)
    setCards(null)
    setReloadCount((count) => count + 1)
  }, [])

  return { cards, loadError, save, remove, reload }
}
