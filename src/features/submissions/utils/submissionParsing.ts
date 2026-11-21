import { parseApiCard } from '../../cards/utils/cardParsing'
import type { Submission } from '../types'

function parseSubmission(value: unknown): Submission | null {
  const card = parseApiCard(value)
  if (!card) return null
  const submittedBy = (value as Record<string, unknown>).submittedBy
  return {
    ...card,
    submittedBy: typeof submittedBy === 'string' && submittedBy.trim() !== '' ? submittedBy.trim() : null,
  }
}

export function parseSubmissions(value: unknown): Submission[] {
  if (!Array.isArray(value)) return []
  return value.map(parseSubmission).filter((item): item is Submission => item !== null)
}

/** The page guests scan to suggest cards. */
export function resolveSubmitUrl(publicUrl: string): string {
  try {
    return new URL('/submit', publicUrl).toString()
  } catch {
    return `${publicUrl.replace(/\/$/, '')}/submit`
  }
}
