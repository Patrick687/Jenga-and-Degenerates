export type Role = 'INNOCENT' | 'ASSASSIN'
export type LifeStatus = 'ALIVE' | 'DEAD'
export type DeathReason = 'ASSASSINATED' | 'VOTED_OUT' | 'HOST'
export type EventKind =
  | 'JOINED'
  | 'KILLED'
  | 'VOTE_STARTED'
  | 'VOTE_RESULT'
  | 'LEFT'
  | 'RETURNED'
  | 'ROLE_ASSIGNED'
  | 'HOST'

export interface PublicPlayer {
  id: string
  name: string
  status: LifeStatus
  present: boolean
  deathReason: DeathReason | null
  /** Only set for players who were voted out. */
  revealedRole: Role | null
}

export interface Me {
  id: string
  name: string
  role: Role
  status: LifeStatus
  present: boolean
  deathReason: DeathReason | null
  /** Epoch ms, server time. Assassins only. */
  nextKillAt: number | null
  canDecline: boolean
  declinedAssassin: boolean
  partners: PublicPlayer[]
}

export interface VoteInfo {
  id: string
  startedByName: string
  /** Epoch ms, server time. */
  endsAt: number
  ballotsCast: number
  eligibleVoters: number
  myCandidateId: string | null
  startedByMe: boolean
}

export interface GameEvent {
  id: number
  kind: EventKind
  message: string
  createdAt: number
  isPrivate: boolean
}

export interface PartyStats {
  total: number
  alive: number
  dead: number
  away: number
  assassinsAlive: number
}

export interface AssassinState {
  me: Me
  players: PublicPlayer[]
  vote: VoteInfo | null
  /** Newest first. */
  events: GameEvent[]
  stats: PartyStats
  /** Add to Date.now() to get server time. */
  clockOffsetMs: number
  cooldownMinutes: number
}

export interface AdminPlayer {
  id: string
  name: string
  role: Role
  status: LifeStatus
  present: boolean
  deathReason: DeathReason | null
  group: number
  nextKillAt: number | null
}
