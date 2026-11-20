import { describe, expect, it } from 'vitest'
import { ALL_PROMPTS } from '.'
import { CATEGORIES } from './categories'

describe('prompt library', () => {
  it('has unique IDs', () => {
    const ids = ALL_PROMPTS.map((prompt) => prompt.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no empty or duplicate prompt text', () => {
    const texts = ALL_PROMPTS.map((prompt) => prompt.text.trim().toLowerCase())
    expect(texts.every((text) => text.length > 0)).toBe(true)
    expect(new Set(texts).size).toBe(texts.length)
  })

  it.each(CATEGORIES)('has at least 18 base %s prompts', (category) => {
    const base = ALL_PROMPTS.filter((prompt) => prompt.category === category && !prompt.spicy)
    expect(base.length).toBeGreaterThanOrEqual(18)
  })

  it.each(CATEGORIES)('has spicy %s prompts', (category) => {
    const spicy = ALL_PROMPTS.filter((prompt) => prompt.category === category && prompt.spicy)
    expect(spicy.length).toBeGreaterThan(0)
  })

  it('keeps prompts short enough to read at a glance', () => {
    expect(ALL_PROMPTS.every((prompt) => prompt.text.length <= 140)).toBe(true)
  })

  it('never asks players to drink', () => {
    expect(ALL_PROMPTS.some((prompt) => /\b(drink|shot|chug)\b/i.test(prompt.text))).toBe(false)
  })
})
