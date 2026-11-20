import { CATEGORIES } from '../data/categories'
import type { Category, HistoryEntry, Mode, PersistedGameState } from '../types/game.types'

export const STORAGE_KEY = 'jenga-and-degenerates:game:v1'
export const MAX_HISTORY = 100

export const DEFAULT_PERSISTED_STATE: PersistedGameState = {
  version: 1,
  mode: 'random',
  spicy: false,
  usedIds: [],
  history: [],
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isCategory(value: unknown): value is Category {
  return CATEGORIES.some((category) => category === value)
}

function isMode(value: unknown): value is Mode {
  return value === 'random' || isCategory(value)
}

function parseHistoryEntry(value: unknown): HistoryEntry | null {
  if (!isRecord(value)) return null
  const { id, promptId, category, text, spicy, timestamp, passed } = value
  if (
    typeof id !== 'string' ||
    typeof promptId !== 'string' ||
    !isCategory(category) ||
    typeof text !== 'string' ||
    text.length === 0 ||
    typeof timestamp !== 'number' ||
    !Number.isFinite(timestamp)
  ) {
    return null
  }
  return { id, promptId, category, text, spicy: spicy === true, timestamp, passed: passed === true }
}

/**
 * Turns whatever was in localStorage into a valid state. Corrupt, outdated,
 * or missing data falls back to defaults instead of crashing the app.
 * `knownPromptIds` drops IDs for prompts that no longer exist in the library.
 */
export function parsePersistedState(
  raw: unknown,
  knownPromptIds?: ReadonlySet<string>,
): PersistedGameState {
  if (!isRecord(raw) || raw.version !== 1) return { ...DEFAULT_PERSISTED_STATE }

  const usedIds = Array.isArray(raw.usedIds)
    ? raw.usedIds.filter(
        (id): id is string => typeof id === 'string' && (!knownPromptIds || knownPromptIds.has(id)),
      )
    : []

  const history = Array.isArray(raw.history)
    ? raw.history
        .map(parseHistoryEntry)
        .filter((entry): entry is HistoryEntry => entry !== null)
        .slice(0, MAX_HISTORY)
    : []

  return {
    version: 1,
    mode: isMode(raw.mode) ? raw.mode : DEFAULT_PERSISTED_STATE.mode,
    spicy: raw.spicy === true,
    usedIds,
    history,
  }
}
