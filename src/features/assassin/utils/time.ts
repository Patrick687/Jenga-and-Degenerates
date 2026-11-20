/** Milliseconds until `targetMs` (server time), using the offset from the last server response. */
export function remainingMs(targetMs: number, clockOffsetMs: number, now: number = Date.now()): number {
  return Math.max(0, targetMs - (now + clockOffsetMs))
}

/** 7:05 style countdown. Rounds up so it never shows 0:00 before the moment arrives. */
export function formatCountdown(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/** "just now", "3 min ago", "1 h ago". */
export function timeAgo(thenMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.round((nowMs - thenMs) / 1000))
  if (seconds < 45) return 'just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  return `${Math.round(minutes / 60)} h ago`
}

/** "1 minute", "12 minutes". */
export function minutesLabel(minutes: number): string {
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}
