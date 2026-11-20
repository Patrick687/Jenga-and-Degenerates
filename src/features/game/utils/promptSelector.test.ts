import { describe, expect, it } from 'vitest'
import type { Category, Prompt } from '../types/game.types'
import { selectPrompt, type RandomSource } from './promptSelector'

/** Small deterministic PRNG (mulberry32) so tests are repeatable. */
function seededRandom(seed: number): RandomSource {
  let state = seed
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makePrompts(category: Category, count: number, spicy = false): Prompt[] {
  const prefix = spicy ? `spicy-${category}` : category
  return Array.from({ length: count }, (_, index) => ({
    id: `${prefix}-${index + 1}`,
    category,
    text: `${prefix} prompt ${index + 1}`,
    spicy,
  }))
}

const baseLibrary: Prompt[] = [
  ...makePrompts('truth', 4),
  ...makePrompts('dare', 4),
  ...makePrompts('chaos', 4),
]

const spicyLibrary: Prompt[] = [
  ...baseLibrary,
  ...makePrompts('truth', 2, true),
  ...makePrompts('dare', 2, true),
  ...makePrompts('chaos', 2, true),
]

/** Draws repeatedly the way the app does, carrying used IDs and the last prompt forward. */
function drawMany(
  count: number,
  options: { prompts: readonly Prompt[]; mode: 'random' | Category; spicy?: boolean; seed?: number },
) {
  const random = seededRandom(options.seed ?? 1)
  let usedIds: string[] = []
  let lastPrompt: Prompt | null = null
  const drawn: Prompt[] = []
  const resets: boolean[] = []
  for (let i = 0; i < count; i += 1) {
    const result = selectPrompt({
      prompts: options.prompts,
      mode: options.mode,
      spicy: options.spicy ?? false,
      usedIds,
      lastPrompt,
      random,
    })
    if (!result) break
    drawn.push(result.prompt)
    resets.push(result.poolWasReset)
    usedIds = result.usedIds
    lastPrompt = result.prompt
  }
  return { drawn, resets, usedIds }
}

describe('selectPrompt: requested category', () => {
  it.each(['truth', 'dare', 'chaos'] as const)('only returns %s prompts in %s mode', (category) => {
    const { drawn } = drawMany(30, { prompts: baseLibrary, mode: category })
    expect(drawn).toHaveLength(30)
    expect(drawn.every((prompt) => prompt.category === category)).toBe(true)
  })
})

describe('selectPrompt: random mode', () => {
  it('draws from every category', () => {
    const { drawn } = drawMany(30, { prompts: baseLibrary, mode: 'random' })
    const categories = new Set(drawn.map((prompt) => prompt.category))
    expect(categories).toEqual(new Set(['truth', 'dare', 'chaos']))
  })

  it('does not serve the same category twice in a row when others are available', () => {
    const { drawn } = drawMany(60, { prompts: baseLibrary, mode: 'random', seed: 7 })
    for (let i = 1; i < drawn.length; i += 1) {
      expect(drawn[i].category).not.toBe(drawn[i - 1].category)
    }
  })

  it('still works when only one category has prompts', () => {
    const { drawn } = drawMany(10, { prompts: makePrompts('dare', 3), mode: 'random' })
    expect(drawn).toHaveLength(10)
    expect(drawn.every((prompt) => prompt.category === 'dare')).toBe(true)
  })
})

describe('selectPrompt: repeats and exhaustion', () => {
  it('never repeats a prompt before the category pool is exhausted', () => {
    const { drawn, resets } = drawMany(4, { prompts: baseLibrary, mode: 'truth' })
    expect(new Set(drawn.map((prompt) => prompt.id)).size).toBe(4)
    expect(resets.some(Boolean)).toBe(false)
  })

  it('resets an exhausted category and keeps going', () => {
    const { drawn, resets } = drawMany(9, { prompts: baseLibrary, mode: 'truth' })
    expect(drawn).toHaveLength(9)
    expect(resets[4]).toBe(true)
    // Every full cycle of 4 uses each prompt exactly once.
    expect(new Set(drawn.slice(0, 4).map((prompt) => prompt.id)).size).toBe(4)
    expect(new Set(drawn.slice(4, 8).map((prompt) => prompt.id)).size).toBe(4)
  })

  it('only clears the exhausted category when resetting', () => {
    const usedIds = ['truth-1', 'truth-2', 'truth-3', 'truth-4', 'dare-1']
    const result = selectPrompt({
      prompts: baseLibrary,
      mode: 'truth',
      spicy: false,
      usedIds,
      random: seededRandom(3),
    })
    expect(result?.poolWasReset).toBe(true)
    expect(result?.usedIds).toContain('dare-1')
    expect(result?.usedIds.filter((id) => id.startsWith('truth'))).toHaveLength(1)
  })

  it('keeps usage history when switching modes back and forth', () => {
    const random = seededRandom(11)
    const first = selectPrompt({ prompts: baseLibrary, mode: 'truth', spicy: false, usedIds: [], random })
    const second = selectPrompt({
      prompts: baseLibrary,
      mode: 'dare',
      spicy: false,
      usedIds: first?.usedIds ?? [],
      lastPrompt: first?.prompt,
      random,
    })
    const third = selectPrompt({
      prompts: baseLibrary,
      mode: 'truth',
      spicy: false,
      usedIds: second?.usedIds ?? [],
      lastPrompt: second?.prompt,
      random,
    })
    expect(third?.prompt.id).not.toBe(first?.prompt.id)
    expect(third?.usedIds).toHaveLength(3)
  })

  it('does not mutate the used ID list it is given', () => {
    const usedIds = ['truth-1']
    selectPrompt({ prompts: baseLibrary, mode: 'truth', spicy: false, usedIds, random: seededRandom(2) })
    expect(usedIds).toEqual(['truth-1'])
  })
})

describe('selectPrompt: immediate repeats', () => {
  it('does not repeat the last prompt right after a pool reset', () => {
    const prompts = makePrompts('truth', 2)
    for (let seed = 1; seed <= 25; seed += 1) {
      const { drawn } = drawMany(20, { prompts, mode: 'truth', seed })
      for (let i = 1; i < drawn.length; i += 1) {
        expect(drawn[i].id).not.toBe(drawn[i - 1].id)
      }
    }
  })

  it('allows a repeat only when the pool has a single prompt', () => {
    const { drawn } = drawMany(3, { prompts: makePrompts('chaos', 1), mode: 'chaos' })
    expect(drawn.map((prompt) => prompt.id)).toEqual(['chaos-1', 'chaos-1', 'chaos-1'])
  })
})

describe('selectPrompt: spicy filter', () => {
  it('never serves spicy prompts when spicy mode is off', () => {
    const { drawn } = drawMany(60, { prompts: spicyLibrary, mode: 'random', spicy: false })
    expect(drawn.some((prompt) => prompt.spicy)).toBe(false)
  })

  it('serves spicy prompts, and only real ones per category, when spicy mode is on', () => {
    // Truth pool is 4 base + 2 spicy = 6: a full cycle must include both spicy prompts.
    const { drawn } = drawMany(6, { prompts: spicyLibrary, mode: 'truth', spicy: true })
    expect(new Set(drawn.map((prompt) => prompt.id)).size).toBe(6)
    expect(drawn.filter((prompt) => prompt.spicy)).toHaveLength(2)
    expect(drawn.every((prompt) => prompt.category === 'truth')).toBe(true)
  })

  it('does not treat unused spicy prompts as part of the pool when spicy is off', () => {
    const { resets } = drawMany(5, { prompts: spicyLibrary, mode: 'truth', spicy: false })
    expect(resets[4]).toBe(true)
  })
})

describe('selectPrompt: empty or unavailable pools', () => {
  it('returns null when there are no prompts', () => {
    expect(selectPrompt({ prompts: [], mode: 'random', spicy: true, usedIds: [] })).toBeNull()
  })

  it('returns null when the requested category has no prompts', () => {
    expect(
      selectPrompt({ prompts: makePrompts('truth', 3), mode: 'dare', spicy: false, usedIds: [] }),
    ).toBeNull()
  })

  it('returns null when only spicy prompts exist and spicy mode is off', () => {
    expect(
      selectPrompt({ prompts: makePrompts('dare', 3, true), mode: 'dare', spicy: false, usedIds: [] }),
    ).toBeNull()
  })

  it('never returns an empty prompt', () => {
    const { drawn } = drawMany(50, { prompts: spicyLibrary, mode: 'random', spicy: true })
    expect(drawn.every((prompt) => prompt.text.length > 0)).toBe(true)
  })

  it('handles a random source that returns exactly 1', () => {
    const result = selectPrompt({
      prompts: baseLibrary,
      mode: 'random',
      spicy: false,
      usedIds: [],
      random: () => 1,
    })
    expect(result?.prompt).toBeDefined()
  })
})
