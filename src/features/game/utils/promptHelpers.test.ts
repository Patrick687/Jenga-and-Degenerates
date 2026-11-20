import { describe, expect, it } from 'vitest'
import type { HistoryEntry } from '../types/game.types'
import {
  countByCategory,
  countPassed,
  createHistoryEntry,
  createPrompts,
  formatRelativeTime,
  getPromptSizeClass,
} from './promptHelpers'

const entry = (category: HistoryEntry['category'], passed = false): HistoryEntry => ({
  id: `${category}-${Math.random()}`,
  promptId: `${category}-01`,
  category,
  text: 'x',
  spicy: false,
  timestamp: 0,
  passed,
})

describe('createPrompts', () => {
  it('builds stable, prefixed IDs', () => {
    const base = createPrompts('truth', false, ['a', 'b'])
    const spicy = createPrompts('dare', true, ['c'])
    expect(base.map((prompt) => prompt.id)).toEqual(['truth-01', 'truth-02'])
    expect(spicy[0]).toEqual({ id: 'spicy-dare-01', category: 'dare', text: 'c', spicy: true })
  })
})

describe('createHistoryEntry', () => {
  it('copies the prompt and starts un-passed', () => {
    const [prompt] = createPrompts('chaos', false, ['Everyone cheers.'])
    const result = createHistoryEntry(prompt, 123)
    expect(result).toMatchObject({ promptId: 'chaos-01', category: 'chaos', timestamp: 123, passed: false })
  })
})

describe('history stats', () => {
  it('counts entries per category and passes', () => {
    const history = [entry('truth'), entry('truth', true), entry('dare'), entry('chaos', true)]
    expect(countByCategory(history)).toEqual({ truth: 2, dare: 1, chaos: 1 })
    expect(countPassed(history)).toBe(2)
  })
})

describe('formatRelativeTime', () => {
  const now = 1_000_000_000
  it.each([
    [0, 'just now'],
    [30_000, 'just now'],
    [5 * 60_000, '5m ago'],
    [3 * 3_600_000, '3h ago'],
    [2 * 86_400_000, '2d ago'],
  ])('formats %i ms ago as %s', (elapsed, expected) => {
    expect(formatRelativeTime(now - elapsed, now)).toBe(expected)
  })

  it('never goes negative for clock skew', () => {
    expect(formatRelativeTime(now + 5000, now)).toBe('just now')
  })
})

describe('getPromptSizeClass', () => {
  it('shrinks type as prompts get longer', () => {
    expect(getPromptSizeClass('short')).toContain('text-4xl')
    expect(getPromptSizeClass('x'.repeat(100))).toContain('text-3xl')
    expect(getPromptSizeClass('x'.repeat(130))).toContain('text-2xl')
  })
})
