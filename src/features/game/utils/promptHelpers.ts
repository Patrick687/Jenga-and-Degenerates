import { CATEGORIES } from '../data/categories'
import type { Category, HistoryEntry, Prompt } from '../types/game.types'

/** Builds prompt objects with stable, position-based IDs like `truth-01` or `spicy-dare-03`. */
export function createPrompts(
  category: Category,
  spicy: boolean,
  texts: readonly string[],
): Prompt[] {
  const prefix = spicy ? `spicy-${category}` : category
  return texts.map((text, index) => ({
    id: `${prefix}-${String(index + 1).padStart(2, '0')}`,
    category,
    text,
    spicy,
  }))
}

export function createHistoryEntry(prompt: Prompt, timestamp: number): HistoryEntry {
  return {
    id: `${timestamp}-${prompt.id}`,
    promptId: prompt.id,
    category: prompt.category,
    text: prompt.text,
    spicy: prompt.spicy,
    timestamp,
    passed: false,
  }
}

export function countByCategory(history: readonly HistoryEntry[]): Record<Category, number> {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category, 0])) as Record<
    Category,
    number
  >
  for (const entry of history) counts[entry.category] += 1
  return counts
}

export function countPassed(history: readonly HistoryEntry[]): number {
  return history.filter((entry) => entry.passed).length
}

/** Short relative time for the history list: "just now", "5m ago", "2h ago", "3d ago". */
export function formatRelativeTime(timestamp: number, now: number): string {
  const seconds = Math.max(0, Math.round((now - timestamp) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.round(hours / 24)}d ago`
}

/** Picks a text size class so short prompts feel huge and long ones still fit. */
export function getPromptSizeClass(text: string): string {
  if (text.length <= 70) return 'text-4xl sm:text-5xl'
  if (text.length <= 120) return 'text-3xl sm:text-4xl'
  return 'text-2xl sm:text-3xl'
}

/** Drops "already shown" IDs for cards that no longer exist (e.g. deleted in the card manager). */
export function pruneUsedIds(usedIds: readonly string[], prompts: readonly Prompt[]): string[] {
  const validIds = new Set(prompts.map((prompt) => prompt.id))
  return usedIds.filter((id) => validIds.has(id))
}
