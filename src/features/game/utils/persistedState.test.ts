import { describe, expect, it } from 'vitest'
import { DEFAULT_PERSISTED_STATE, MAX_HISTORY, parsePersistedState } from './persistedState'

const validEntry = {
  id: '1-truth-01',
  promptId: 'truth-01',
  category: 'truth',
  text: 'A prompt',
  spicy: false,
  timestamp: 1_700_000_000_000,
  passed: true,
}

describe('parsePersistedState', () => {
  it.each([null, undefined, 'nope', 42, [], { version: 2 }])('falls back to defaults for %j', (raw) => {
    expect(parsePersistedState(raw)).toEqual(DEFAULT_PERSISTED_STATE)
  })

  it('restores valid state', () => {
    const state = parsePersistedState({
      version: 1,
      mode: 'dare',
      spicy: true,
      usedIds: ['truth-01'],
      history: [validEntry],
    })
    expect(state.mode).toBe('dare')
    expect(state.spicy).toBe(true)
    expect(state.usedIds).toEqual(['truth-01'])
    expect(state.history).toEqual([validEntry])
  })

  it('drops invalid history entries and bad field values', () => {
    const state = parsePersistedState({
      version: 1,
      mode: 'bogus',
      spicy: 'yes',
      usedIds: ['ok', 7, null],
      history: [validEntry, { ...validEntry, category: 'nope' }, 'junk', { ...validEntry, text: '' }],
    })
    expect(state.mode).toBe('random')
    expect(state.spicy).toBe(false)
    expect(state.usedIds).toEqual(['ok'])
    expect(state.history).toHaveLength(1)
  })

  it('drops used IDs for prompts that no longer exist', () => {
    const state = parsePersistedState(
      { version: 1, usedIds: ['truth-01', 'removed-99'] },
      new Set(['truth-01']),
    )
    expect(state.usedIds).toEqual(['truth-01'])
  })

  it('caps history length', () => {
    const history = Array.from({ length: MAX_HISTORY + 20 }, (_, i) => ({ ...validEntry, id: String(i) }))
    expect(parsePersistedState({ version: 1, history }).history).toHaveLength(MAX_HISTORY)
  })
})
