import { describe, expect, it } from 'vitest'
import type { GameEvent } from '../types'
import { deriveEventAlerts, latestEventId } from './alerts'
import { parseAssassinState } from './parseState'
import { formatCountdown, minutesLabel, remainingMs, timeAgo } from './time'

const event = (id: number, overrides: Partial<GameEvent> = {}): GameEvent => ({
  id,
  kind: 'KILLED',
  message: `event ${id}`,
  createdAt: 0,
  isPrivate: false,
  ...overrides,
})

const rawState = (overrides: Record<string, unknown> = {}) => ({
  me: {
    id: 'p1',
    name: 'Pat',
    role: 'ASSASSIN',
    status: 'ALIVE',
    present: true,
    deathReason: null,
    nextKillAt: '2026-11-21T20:12:00.000Z',
    canDecline: true,
    declinedAssassin: false,
    partners: [{ id: 'p2', name: 'Sam', status: 'ALIVE', present: true, deathReason: null, revealedRole: null }],
  },
  players: [{ id: 'p1', name: 'Pat', status: 'ALIVE', present: true, deathReason: null, revealedRole: null }],
  vote: null,
  events: [{ id: 1, kind: 'JOINED', message: 'Pat joined the party.', createdAt: '2026-11-21T20:00:00.000Z', isPrivate: false }],
  stats: { total: 1, alive: 1, dead: 0, away: 0, assassinsAlive: 1 },
  serverTime: '2026-11-21T20:00:10.000Z',
  cooldownMinutes: 12,
  ...overrides,
})

describe('parseAssassinState', () => {
  it('parses a valid state and works out the clock offset', () => {
    const now = Date.parse('2026-11-21T20:00:00.000Z')
    const state = parseAssassinState(rawState(), now)
    expect(state?.me.role).toBe('ASSASSIN')
    expect(state?.me.partners[0]?.name).toBe('Sam')
    expect(state?.clockOffsetMs).toBe(10_000)
    expect(state?.me.nextKillAt).toBe(Date.parse('2026-11-21T20:12:00.000Z'))
  })

  it('rejects anything malformed', () => {
    expect(parseAssassinState(null)).toBeNull()
    expect(parseAssassinState(rawState({ stats: { total: 'x' } }))).toBeNull()
    expect(parseAssassinState(rawState({ players: [{ id: 1 }] }))).toBeNull()
    expect(parseAssassinState(rawState({ vote: { id: 'v' } }))).toBeNull()
  })

  it('parses an open vote', () => {
    const vote = {
      id: 'v1',
      startedByName: 'Pat',
      endsAt: '2026-11-21T20:02:00.000Z',
      ballotsCast: 2,
      eligibleVoters: 5,
      myCandidateId: null,
      startedByMe: true,
    }
    expect(parseAssassinState(rawState({ vote }))?.vote).toMatchObject({ id: 'v1', ballotsCast: 2, startedByMe: true })
  })
})

describe('deriveEventAlerts', () => {
  it('only reports events newer than the last one seen', () => {
    const alerts = deriveEventAlerts([event(5), event(4), event(3)], 3)
    expect(alerts.map((a) => a.id)).toEqual(['event-4', 'event-5'])
  })

  it('always includes private notices and marks a private kill as danger', () => {
    const events = [event(9, { isPrivate: true, message: 'You have been assassinated!' }), event(8), event(7), event(6), event(5)]
    const alerts = deriveEventAlerts(events, 0)
    expect(alerts.find((a) => a.id === 'event-9')?.tone).toBe('danger')
    // Only the 3 latest public events come along with it.
    expect(alerts.map((a) => a.id)).toEqual(['event-6', 'event-7', 'event-8', 'event-9'])
  })

  it('stays quiet about joins and leaves', () => {
    expect(deriveEventAlerts([event(2, { kind: 'JOINED' }), event(1, { kind: 'LEFT' })], 0)).toEqual([])
  })

  it('finds the latest event id', () => {
    expect(latestEventId([event(4), event(9), event(2)])).toBe(9)
    expect(latestEventId([])).toBe(0)
  })
})

describe('time helpers', () => {
  it('counts down using the server offset', () => {
    expect(remainingMs(10_000, 2_000, 5_000)).toBe(3_000)
    expect(remainingMs(10_000, 0, 20_000)).toBe(0)
  })

  it('formats countdowns and relative times', () => {
    expect(formatCountdown(0)).toBe('0:00')
    expect(formatCountdown(61_000)).toBe('1:01')
    expect(formatCountdown(719_001)).toBe('12:00')
    expect(minutesLabel(1)).toBe('1 minute')
    expect(minutesLabel(12)).toBe('12 minutes')
    expect(timeAgo(0, 10_000)).toBe('just now')
    expect(timeAgo(0, 180_000)).toBe('3 min ago')
    expect(timeAgo(0, 7_300_000)).toBe('2 h ago')
  })
})
