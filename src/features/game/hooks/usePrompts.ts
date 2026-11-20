import { useEffect, useState } from 'react'
import { fetchCards } from '../../cards/api/cardsApi'
import { readCachedPrompts, writeCachedPrompts } from '../../cards/utils/cardsCache'
import { ALL_PROMPTS } from '../data'
import type { Prompt } from '../types/game.types'

/**
 * The cards the game draws from.
 *
 * Starts immediately with the last cards this phone saved (or the ones bundled
 * with the app), then quietly swaps in the latest from the server. If the server
 * is unreachable, slow, or has no cards, the game just keeps working with what it has.
 */
export function usePrompts(): readonly Prompt[] {
  const [prompts, setPrompts] = useState<readonly Prompt[]>(() => readCachedPrompts() ?? ALL_PROMPTS)

  useEffect(() => {
    const controller = new AbortController()
    fetchCards(controller.signal)
      .then((cards) => {
        if (cards.length === 0) return
        setPrompts(cards)
        writeCachedPrompts(cards)
      })
      .catch(() => {
        // Offline or server down: keep the cards we already have.
      })
    return () => controller.abort()
  }, [])

  return prompts
}
