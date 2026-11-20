import { useCallback, useEffect, useReducer } from 'react'
import { ALL_PROMPTS } from '../data'
import type { HistoryEntry, Mode, PersistedGameState, Prompt } from '../types/game.types'
import { MAX_HISTORY } from '../utils/persistedState'
import { createHistoryEntry } from '../utils/promptHelpers'
import { selectPrompt, type RandomSource } from '../utils/promptSelector'
import { useGamePersistence } from './useGamePersistence'

interface GameState extends PersistedGameState {
  /** The prompt on screen. Not persisted: a fresh visit starts on the home screen. */
  current: HistoryEntry | null
  /** True if a draw found nothing eligible to show. */
  isEmpty: boolean
}

type GameAction =
  | { type: 'drew'; entry: HistoryEntry; usedIds: string[]; passedEntryId?: string }
  | { type: 'empty' }
  | { type: 'mode'; mode: Mode }
  | { type: 'spicy'; spicy: boolean }
  | { type: 'reset' }

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'drew': {
      const history = state.history.map((entry) =>
        entry.id === action.passedEntryId ? { ...entry, passed: true } : entry,
      )
      return {
        ...state,
        current: action.entry,
        isEmpty: false,
        usedIds: action.usedIds,
        history: [action.entry, ...history].slice(0, MAX_HISTORY),
      }
    }
    case 'empty':
      return { ...state, isEmpty: true }
    case 'mode':
      return { ...state, mode: action.mode, isEmpty: false }
    case 'spicy':
      return { ...state, spicy: action.spicy, isEmpty: false }
    case 'reset':
      return { ...state, current: null, isEmpty: false, usedIds: [], history: [] }
  }
}

interface Options {
  prompts?: readonly Prompt[]
  random?: RandomSource
  now?: () => number
}

export function usePromptGenerator({
  prompts = ALL_PROMPTS,
  random = Math.random,
  now = Date.now,
}: Options = {}) {
  const { initialState, save } = useGamePersistence()
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (persisted): GameState => ({ ...persisted, current: null, isEmpty: false }),
  )
  const { mode, spicy, usedIds, history, current, isEmpty } = state

  useEffect(() => {
    save({ version: 1, mode, spicy, usedIds, history })
  }, [save, mode, spicy, usedIds, history])

  const draw = useCallback(
    (options: { pass?: boolean } = {}) => {
      const result = selectPrompt({
        prompts,
        mode,
        spicy,
        usedIds,
        lastPrompt: current ? { id: current.promptId, category: current.category } : null,
        random,
      })
      if (!result) {
        dispatch({ type: 'empty' })
        return
      }
      dispatch({
        type: 'drew',
        entry: createHistoryEntry(result.prompt, now()),
        usedIds: result.usedIds,
        passedEntryId: options.pass && current ? current.id : undefined,
      })
    },
    [prompts, mode, spicy, usedIds, current, random, now],
  )

  const next = useCallback(() => draw(), [draw])
  const pass = useCallback(() => draw({ pass: true }), [draw])
  const setMode = useCallback((nextMode: Mode) => dispatch({ type: 'mode', mode: nextMode }), [])
  const setSpicy = useCallback((nextSpicy: boolean) => dispatch({ type: 'spicy', spicy: nextSpicy }), [])
  const reset = useCallback(() => dispatch({ type: 'reset' }), [])

  return { mode, spicy, current, history, isEmpty, next, pass, setMode, setSpicy, reset }
}
