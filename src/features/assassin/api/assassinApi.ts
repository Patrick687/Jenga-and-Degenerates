import { GraphQLRequestError, graphqlRequest } from '../../../lib/graphql'
import type { AdminPlayer, AssassinState, LifeStatus, Role } from '../types'
import { parseAdminPlayers, parseAssassinState } from '../utils/parseState'

const STATE_FIELDS = `
  me { id name role status present deathReason nextKillAt canDecline declinedAssassin
       partners { id name status present deathReason revealedRole } }
  players { id name status present deathReason revealedRole }
  vote { id startedByName startedAt endsAt ballotsCast eligibleVoters myCandidateId startedByMe }
  events { id kind message createdAt isPrivate }
  stats { total alive dead away assassinsAlive }
  serverTime
  cooldownMinutes
`

function requireState(raw: unknown): AssassinState {
  const state = parseAssassinState(raw)
  if (!state) throw new GraphQLRequestError('server', 'The server sent back something unexpected.')
  return state
}

export async function joinParty(name: string): Promise<{ token: string; state: AssassinState }> {
  const data = await graphqlRequest(
    `mutation ($name: String!) { joinParty(input: { name: $name }) { token state { ${STATE_FIELDS} } } }`,
    { variables: { name } },
  )
  const result = data.joinParty as { token?: unknown; state?: unknown } | null
  if (!result || typeof result.token !== 'string') {
    throw new GraphQLRequestError('server', 'The server sent back something unexpected.')
  }
  return { token: result.token, state: requireState(result.state) }
}

export async function fetchState(token: string, signal?: AbortSignal): Promise<AssassinState> {
  const data = await graphqlRequest(`query { assassinState { ${STATE_FIELDS} } }`, {
    playerToken: token,
    ...(signal ? { signal } : {}),
  })
  return requireState(data.assassinState)
}

async function action(
  token: string,
  field: string,
  args: string,
  variables: Record<string, unknown> = {},
  declarations = '',
): Promise<AssassinState> {
  const header = declarations ? `mutation (${declarations})` : 'mutation'
  const data = await graphqlRequest(`${header} { ${field}${args} { ${STATE_FIELDS} } }`, {
    playerToken: token,
    variables,
  })
  return requireState(data[field])
}

export const declineAssassin = (token: string) => action(token, 'declineAssassin', '')
export const leaveParty = (token: string) => action(token, 'leaveParty', '')
export const returnToParty = (token: string) => action(token, 'returnToParty', '')
export const startVote = (token: string) => action(token, 'startVote', '')
export const endVote = (token: string) => action(token, 'endVote', '')

export const assassinate = (token: string, targetId: string) =>
  action(token, 'assassinate', '(targetId: $id)', { id: targetId }, '$id: ID!')

export const castVote = (token: string, voteId: string, candidateId: string) =>
  action(token, 'castVote', '(voteId: $vote, candidateId: $who)', { vote: voteId, who: candidateId }, '$vote: ID!, $who: ID!')

// ---- Host tools (admin password) ----

export async function fetchAdminPlayers(password: string): Promise<AdminPlayer[]> {
  const data = await graphqlRequest(
    'query { adminAssassinPlayers { id name role status present deathReason group nextKillAt } }',
    { password },
  )
  const players = parseAdminPlayers(data.adminAssassinPlayers)
  if (!players) throw new GraphQLRequestError('server', 'The server sent back something unexpected.')
  return players
}

export async function adminSetStatus(password: string, id: string, status: LifeStatus): Promise<void> {
  await graphqlRequest('mutation ($id: ID!, $status: LifeStatus!) { adminSetPlayerStatus(id: $id, status: $status) }', {
    password,
    variables: { id, status },
  })
}

export async function adminSetRole(password: string, id: string, role: Role): Promise<void> {
  await graphqlRequest('mutation ($id: ID!, $role: PlayerRole!) { adminSetPlayerRole(id: $id, role: $role) }', {
    password,
    variables: { id, role },
  })
}

export async function adminRemovePlayer(password: string, id: string): Promise<void> {
  await graphqlRequest('mutation ($id: ID!) { adminRemovePlayer(id: $id) }', { password, variables: { id } })
}

export async function adminEndVote(password: string): Promise<void> {
  await graphqlRequest('mutation { adminEndVote }', { password })
}

export async function adminResetGame(password: string): Promise<void> {
  await graphqlRequest('mutation { adminResetAssassin }', { password })
}
