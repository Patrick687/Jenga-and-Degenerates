import { describe, expect, it } from 'vitest'
import type { Prompt } from '../../game/types/game.types'
import { pruneUsedIds } from '../../game/utils/promptHelpers'
import { parseApiCard, parseApiCards, parseCachedPrompts, toApiCategory } from './cardParsing'
import { countCards, DEFAULT_FILTERS, filterCards } from './cardFilters'

const card = (id: string, category: Prompt['category'], text: string, spicy = false): Prompt => ({
  id,
  category,
  text,
  spicy,
})

describe('parseApiCard', () => {
  it('converts API categories to the game shape', () => {
    expect(parseApiCard({ id: 'a1', category: 'CHAOS', text: 'Hello there', spicy: true })).toEqual({
      id: 'a1',
      category: 'chaos',
      text: 'Hello there',
      spicy: true,
    })
  })

  it.each([
    null,
    'string',
    {},
    { id: '', category: 'TRUTH', text: 'x', spicy: false },
    { id: 'a', category: 'truth', text: 'x', spicy: false },
    { id: 'a', category: 'TRUTH', text: '   ', spicy: false },
    { id: 'a', category: 'TRUTH', text: 'ok', spicy: 'no' },
    { id: 'a', category: 'toString', text: 'ok', spicy: false },
  ])('rejects invalid card %j', (value) => {
    expect(parseApiCard(value)).toBeNull()
  })

  it('drops bad entries from a list and tolerates non-arrays', () => {
    const cards = parseApiCards([{ id: 'a', category: 'DARE', text: 'ok card', spicy: false }, 7])
    expect(cards).toHaveLength(1)
    expect(parseApiCards(null)).toEqual([])
  })

  it('maps categories back to the API format', () => {
    expect(toApiCategory('truth')).toBe('TRUTH')
    expect(toApiCategory('dare')).toBe('DARE')
    expect(toApiCategory('chaos')).toBe('CHAOS')
  })
})

describe('parseCachedPrompts', () => {
  const valid = { id: 'a', category: 'dare', text: 'ok card', spicy: false }

  it('restores valid cached cards', () => {
    expect(parseCachedPrompts({ version: 1, prompts: [valid] })).toEqual([valid])
  })

  it.each([
    null,
    { version: 2, prompts: [valid] },
    { version: 1, prompts: [] },
    { version: 1, prompts: [valid, { ...valid, category: 'DARE' }] },
    { version: 1, prompts: 'nope' },
  ])('ignores an unusable cache %j', (raw) => {
    expect(parseCachedPrompts(raw)).toBeNull()
  })
})

describe('filterCards and countCards', () => {
  const cards = [
    card('1', 'truth', 'Worst first date'),
    card('2', 'truth', 'Spicy kiss story', true),
    card('3', 'dare', 'Runway walk'),
    card('4', 'chaos', 'Group vote on dates', true),
  ]

  it('returns everything by default', () => {
    expect(filterCards(cards, DEFAULT_FILTERS)).toHaveLength(4)
  })

  it('filters by category, heat, and search text together', () => {
    expect(filterCards(cards, { ...DEFAULT_FILTERS, category: 'truth' }).map((c) => c.id)).toEqual(['1', '2'])
    expect(filterCards(cards, { ...DEFAULT_FILTERS, heat: 'spicy' }).map((c) => c.id)).toEqual(['2', '4'])
    expect(filterCards(cards, { ...DEFAULT_FILTERS, heat: 'mild' }).map((c) => c.id)).toEqual(['1', '3'])
    expect(filterCards(cards, { category: 'all', heat: 'all', query: '  DATE' }).map((c) => c.id)).toEqual(['1', '4'])
    expect(filterCards(cards, { category: 'truth', heat: 'spicy', query: 'kiss' }).map((c) => c.id)).toEqual(['2'])
  })

  it('counts cards by category and spice level', () => {
    expect(countCards(cards)).toEqual({ total: 4, truth: 2, dare: 1, chaos: 1, spicy: 2 })
  })
})

describe('pruneUsedIds', () => {
  it('keeps only IDs that still exist', () => {
    const prompts = [card('a', 'truth', 'x'), card('b', 'dare', 'y')]
    expect(pruneUsedIds(['a', 'gone', 'b', 'also-gone'], prompts)).toEqual(['a', 'b'])
  })
})
