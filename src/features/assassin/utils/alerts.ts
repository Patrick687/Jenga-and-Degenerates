import type { GameEvent } from '../types'

export type AlertTone = 'danger' | 'info' | 'ready'

export interface PartyAlert {
  id: string
  tone: AlertTone
  title: string
  message: string
}

const MAX_CATCH_UP_PUBLIC = 3

/**
 * Turns events the guest hasn't seen yet into alerts. Private notices always
 * count; of the public ones, only the latest few (so reopening the page after a
 * while doesn't bury you in banners). `events` is newest first.
 */
export function deriveEventAlerts(events: readonly GameEvent[], lastSeenId: number): PartyAlert[] {
  const unseen = events.filter((event) => event.id > lastSeenId).reverse() // oldest first
  const publicIds = new Set(
    unseen
      .filter((event) => !event.isPrivate)
      .slice(-MAX_CATCH_UP_PUBLIC)
      .map((event) => event.id),
  )

  return unseen
    .filter((event) => event.isPrivate || publicIds.has(event.id))
    // Joining and leaving are visible in the feed; they don't need to interrupt anyone.
    .filter((event) => event.isPrivate || !['JOINED', 'LEFT', 'RETURNED'].includes(event.kind))
    .map((event) => ({
      id: `event-${event.id}`,
      tone: event.kind === 'KILLED' && event.isPrivate ? ('danger' as const) : ('info' as const),
      title: titleFor(event),
      message: event.message,
    }))
}

function titleFor(event: GameEvent): string {
  if (event.isPrivate) {
    if (event.kind === 'KILLED') return 'You were assassinated'
    if (event.kind === 'ROLE_ASSIGNED') return 'Your role changed'
    if (event.kind === 'VOTE_RESULT') return 'You were voted out'
  }
  switch (event.kind) {
    case 'KILLED':
      return 'Someone was assassinated'
    case 'VOTE_STARTED':
      return 'Vote called'
    case 'VOTE_RESULT':
      return 'Vote result'
    case 'HOST':
      return 'From the host'
    default:
      return 'Party update'
  }
}

/** Newest event id in the list, or 0. */
export function latestEventId(events: readonly GameEvent[]): number {
  return events.reduce((max, event) => Math.max(max, event.id), 0)
}

let audioContext: AudioContext | null = null

/** Call from a tap so the browser allows sound later. */
export function unlockAudio(): void {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Context) return
    audioContext ??= new Context()
    if (audioContext.state === 'suspended') void audioContext.resume()
  } catch {
    // No sound is fine.
  }
}

const TONES: Record<AlertTone, { notes: number[]; vibrate: number[] }> = {
  danger: { notes: [330, 262, 196], vibrate: [200, 80, 200, 80, 400] },
  ready: { notes: [523, 659, 784], vibrate: [120, 60, 120] },
  info: { notes: [660, 880], vibrate: [100] },
}

/** A short beep sequence and a vibration. Both are best effort (iPhones don't vibrate from the web). */
export function playFeedback(tone: AlertTone, soundOn: boolean): void {
  try {
    navigator.vibrate?.(TONES[tone].vibrate)
  } catch {
    // Not supported.
  }
  if (!soundOn || !audioContext || audioContext.state !== 'running') return
  const context = audioContext
  TONES[tone].notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const start = context.currentTime + index * 0.14
    oscillator.type = 'triangle'
    oscillator.frequency.value = frequency
    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.16)
    oscillator.connect(gain).connect(context.destination)
    oscillator.start(start)
    oscillator.stop(start + 0.18)
  })
}
