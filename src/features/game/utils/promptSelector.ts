import { CATEGORIES } from '../data/categories'
import type { Category, Mode, Prompt } from '../types/game.types'

/** Returns a number in [0, 1), like Math.random. Inject a fake one in tests. */
export type RandomSource = () => number

export interface SelectionInput {
  prompts: readonly Prompt[]
  mode: Mode
  spicy: boolean
  /** IDs already served in the current cycle of each category pool. */
  usedIds: readonly string[]
  /** The prompt shown most recently, used to avoid immediate repeats. */
  lastPrompt?: Pick<Prompt, 'id' | 'category'> | null
  random?: RandomSource
}

export interface SelectionResult {
  prompt: Prompt
  /** New list of used IDs (the input array is never mutated). */
  usedIds: string[]
  /** True when the category pool was exhausted and started a fresh cycle. */
  poolWasReset: boolean
}

function pickIndex(length: number, random: RandomSource): number {
  // Math.min guards against a random source that returns exactly 1.
  return Math.min(Math.floor(random() * length), length - 1)
}

/** Spicy prompts are only eligible when Spicy Mode is on. */
export function getEligiblePrompts(prompts: readonly Prompt[], spicy: boolean): Prompt[] {
  return spicy ? [...prompts] : prompts.filter((prompt) => !prompt.spicy)
}

/**
 * In Random mode, avoid the category that was just served when another
 * category is available, which keeps the mix of Truth, Dare, and Chaos even.
 */
function chooseCategory(
  candidates: readonly Category[],
  lastCategory: Category | undefined,
  random: RandomSource,
): Category {
  const preferred = candidates.filter((category) => category !== lastCategory)
  const options = preferred.length > 0 ? preferred : candidates
  return options[pickIndex(options.length, random)]
}

/**
 * Selects the next prompt.
 *
 * - Only draws from the requested category (or all of them in Random mode).
 * - Never repeats a prompt until its category pool is exhausted, then resets
 *   only that pool.
 * - Avoids repeating the previous prompt when any alternative exists.
 * - Returns null only when there is nothing eligible to show.
 */
export function selectPrompt(input: SelectionInput): SelectionResult | null {
  const { prompts, mode, spicy, usedIds, lastPrompt } = input
  const random = input.random ?? Math.random

  const eligible = getEligiblePrompts(prompts, spicy)
  const requestedCategories = mode === 'random' ? CATEGORIES : [mode]
  const availableCategories = requestedCategories.filter((category) =>
    eligible.some((prompt) => prompt.category === category),
  )
  if (availableCategories.length === 0) return null

  const category =
    mode === 'random'
      ? chooseCategory(availableCategories, lastPrompt?.category, random)
      : availableCategories[0]

  const pool = eligible.filter((prompt) => prompt.category === category)
  const used = new Set(usedIds)

  let nextUsedIds = [...usedIds]
  let unused = pool.filter((prompt) => !used.has(prompt.id))
  let poolWasReset = false

  if (unused.length === 0) {
    const poolIds = new Set(pool.map((prompt) => prompt.id))
    nextUsedIds = nextUsedIds.filter((id) => !poolIds.has(id))
    unused = pool
    poolWasReset = true
  }

  const withoutLast = unused.filter((prompt) => prompt.id !== lastPrompt?.id)
  const candidates = withoutLast.length > 0 ? withoutLast : unused
  const prompt = candidates[pickIndex(candidates.length, random)]

  return { prompt, usedIds: [...nextUsedIds, prompt.id], poolWasReset }
}
