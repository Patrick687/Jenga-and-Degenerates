import { useCallback, useState } from 'react'
import { readJson, writeJson } from '../../../lib/storage'
import type { PersistedGameState } from '../types/game.types'
import { parsePersistedState, STORAGE_KEY } from '../utils/persistedState'

/** Loads saved game state once on mount and exposes a safe `save`. */
export function useGamePersistence() {
  const [initialState] = useState<PersistedGameState>(() => parsePersistedState(readJson(STORAGE_KEY)))

  const save = useCallback((state: PersistedGameState) => {
    writeJson(STORAGE_KEY, state)
  }, [])

  return { initialState, save }
}
