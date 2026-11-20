import type {
  AdminPlayer,
  AssassinState,
  DeathReason,
  EventKind,
  GameEvent,
  LifeStatus,
  Me,
  PartyStats,
  PublicPlayer,
  Role,
  VoteInfo,
} from '../types'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const ROLES: readonly Role[] = ['INNOCENT', 'ASSASSIN']
const STATUSES: readonly LifeStatus[] = ['ALIVE', 'DEAD']
const REASONS: readonly DeathReason[] = ['ASSASSINATED', 'VOTED_OUT', 'HOST']
const KINDS: readonly EventKind[] = [
  'JOINED',
  'KILLED',
  'VOTE_STARTED',
  'VOTE_RESULT',
  'LEFT',
  'RETURNED',
  'ROLE_ASSIGNED',
  'HOST',
]

function oneOf<T extends string>(value: unknown, allowed: readonly T[]): T | null {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

function time(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const ms = Date.parse(value)
  return Number.isNaN(ms) ? null : ms
}

function int(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) ? value : null
}

export function parsePublicPlayer(raw: unknown): PublicPlayer | null {
  if (!isRecord(raw)) return null
  const status = oneOf(raw.status, STATUSES)
  if (typeof raw.id !== 'string' || typeof raw.name !== 'string' || !status || typeof raw.present !== 'boolean') {
    return null
  }
  return {
    id: raw.id,
    name: raw.name,
    status,
    present: raw.present,
    deathReason: oneOf(raw.deathReason, REASONS),
    revealedRole: oneOf(raw.revealedRole, ROLES),
  }
}

function parseList<T>(raw: unknown, parse: (item: unknown) => T | null): T[] | null {
  if (!Array.isArray(raw)) return null
  const items = raw.map(parse)
  return items.every((item): item is T => item !== null) ? items : null
}

function parseMe(raw: unknown): Me | null {
  if (!isRecord(raw)) return null
  const role = oneOf(raw.role, ROLES)
  const status = oneOf(raw.status, STATUSES)
  const partners = parseList(raw.partners, parsePublicPlayer)
  if (
    typeof raw.id !== 'string' ||
    typeof raw.name !== 'string' ||
    !role ||
    !status ||
    typeof raw.present !== 'boolean' ||
    typeof raw.canDecline !== 'boolean' ||
    typeof raw.declinedAssassin !== 'boolean' ||
    !partners
  ) {
    return null
  }
  return {
    id: raw.id,
    name: raw.name,
    role,
    status,
    present: raw.present,
    deathReason: oneOf(raw.deathReason, REASONS),
    nextKillAt: time(raw.nextKillAt),
    canDecline: raw.canDecline,
    declinedAssassin: raw.declinedAssassin,
    partners,
  }
}

function parseVote(raw: unknown): VoteInfo | null {
  if (!isRecord(raw)) return null
  const endsAt = time(raw.endsAt)
  const ballotsCast = int(raw.ballotsCast)
  const eligibleVoters = int(raw.eligibleVoters)
  if (
    typeof raw.id !== 'string' ||
    typeof raw.startedByName !== 'string' ||
    endsAt === null ||
    ballotsCast === null ||
    eligibleVoters === null ||
    typeof raw.startedByMe !== 'boolean'
  ) {
    return null
  }
  return {
    id: raw.id,
    startedByName: raw.startedByName,
    endsAt,
    ballotsCast,
    eligibleVoters,
    myCandidateId: typeof raw.myCandidateId === 'string' ? raw.myCandidateId : null,
    startedByMe: raw.startedByMe,
  }
}

function parseEvent(raw: unknown): GameEvent | null {
  if (!isRecord(raw)) return null
  const kind = oneOf(raw.kind, KINDS)
  const id = int(raw.id)
  const createdAt = time(raw.createdAt)
  if (id === null || !kind || typeof raw.message !== 'string' || createdAt === null || typeof raw.isPrivate !== 'boolean') {
    return null
  }
  return { id, kind, message: raw.message, createdAt, isPrivate: raw.isPrivate }
}

function parseStats(raw: unknown): PartyStats | null {
  if (!isRecord(raw)) return null
  const total = int(raw.total)
  const alive = int(raw.alive)
  const dead = int(raw.dead)
  const away = int(raw.away)
  const assassinsAlive = int(raw.assassinsAlive)
  if (total === null || alive === null || dead === null || away === null || assassinsAlive === null) return null
  return { total, alive, dead, away, assassinsAlive }
}

/** Validates the server's answer; returns null if anything is off, so the UI never shows half-broken data. */
export function parseAssassinState(raw: unknown, now: number = Date.now()): AssassinState | null {
  if (!isRecord(raw)) return null
  const me = parseMe(raw.me)
  const players = parseList(raw.players, parsePublicPlayer)
  const events = parseList(raw.events, parseEvent)
  const stats = parseStats(raw.stats)
  const serverTime = time(raw.serverTime)
  const cooldownMinutes = int(raw.cooldownMinutes)
  if (!me || !players || !events || !stats || serverTime === null || cooldownMinutes === null) return null

  const vote = raw.vote === null || raw.vote === undefined ? null : parseVote(raw.vote)
  if (raw.vote && !vote) return null

  return { me, players, vote, events, stats, clockOffsetMs: serverTime - now, cooldownMinutes }
}

export function parseAdminPlayers(raw: unknown): AdminPlayer[] | null {
  return parseList(raw, (item) => {
    if (!isRecord(item)) return null
    const role = oneOf(item.role, ROLES)
    const status = oneOf(item.status, STATUSES)
    const group = int(item.group)
    if (typeof item.id !== 'string' || typeof item.name !== 'string' || !role || !status || group === null) return null
    if (typeof item.present !== 'boolean') return null
    return {
      id: item.id,
      name: item.name,
      role,
      status,
      present: item.present,
      deathReason: oneOf(item.deathReason, REASONS),
      group,
      nextKillAt: time(item.nextKillAt),
    }
  })
}
