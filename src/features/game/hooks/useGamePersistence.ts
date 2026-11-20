import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../../../lib/storage'
import { ALL_PROMPTS } from '../data'
import type { PersistedGameState } from '../types/game.types'
import { parsePersistedState, STORAGE_KEY } from '../utils/persistedState'

const KNOWN_PROMPT_IDS: ReadonlySet<string> = new Set(ALL_PROMPTS.map((prompt) => prompt.id))

/** Loads saved game state once on mount and exposes a safe `save`. */
export function useGamePersistence() {
  const [initialState] = useState<PersistedGameState>(() =>
    parsePersistedState(readJson(STORAGE_KEY), KNOWN_PROMPT_IDS),
  )

  const save = useCallback((state: PersistedGameState) => {
    writeJson(STORAGE_KEY, state)
  }, [])

  return { initialState, save }
}
