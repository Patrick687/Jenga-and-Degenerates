const API_URL = import.meta.env.VITE_API_URL?.trim() || '/graphql'

export type GraphQLErrorKind = 'network' | 'unauthorized' | 'rate-limited' | 'validation' | 'server'

export class GraphQLRequestError extends Error {
  readonly kind: GraphQLErrorKind

  constructor(kind: GraphQLErrorKind, message: string) {
    super(message)
    this.name = 'GraphQLRequestError'
    this.kind = kind
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Turns the first error in a GraphQL response into a friendly, typed error. */
export function parseGraphQLErrors(errors: unknown): GraphQLRequestError {
  const first = Array.isArray(errors) ? errors[0] : undefined
  if (!isRecord(first)) return new GraphQLRequestError('server', 'Something went wrong on the server.')

  const message = typeof first.message === 'string' ? first.message : 'Something went wrong on the server.'
  const extensions = isRecord(first.extensions) ? first.extensions : {}
  const original = isRecord(extensions.originalError) ? extensions.originalError : {}

  if (extensions.code === 'UNAUTHENTICATED') return new GraphQLRequestError('unauthorized', message)
  if (original.statusCode === 429) return new GraphQLRequestError('rate-limited', message)
  if (extensions.code === 'BAD_REQUEST') {
    // Validation failures carry the readable text in originalError.message (a list).
    const details = original.message
    const text = Array.isArray(details) ? details.filter((d) => typeof d === 'string').join(' ') : message
    return new GraphQLRequestError('validation', text || message)
  }
  return new GraphQLRequestError('server', message)
}

interface RequestOptions {
  variables?: Record<string, unknown>
  /** Admin password; sent as a Bearer token. */
  password?: string
  /** Assassin game guest token; sent as X-Player-Token. */
  playerToken?: string
  signal?: AbortSignal
}

/** Minimal GraphQL-over-fetch client. Returns the raw `data` object for the caller to validate. */
export async function graphqlRequest(
  query: string,
  { variables, password, playerToken, signal }: RequestOptions = {},
): Promise<Record<string, unknown>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (password) headers.Authorization = `Bearer ${password}`
  if (playerToken) headers['X-Player-Token'] = playerToken

  let response: Response
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, variables }),
      ...(signal ? { signal } : {}),
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new GraphQLRequestError('network', "Can't reach the server. Check your connection.")
  }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new GraphQLRequestError('network', "The server isn't responding properly. Try again in a moment.")
  }

  if (isRecord(body) && body.errors) throw parseGraphQLErrors(body.errors)
  if (!isRecord(body) || !isRecord(body.data)) {
    throw new GraphQLRequestError('server', 'The server sent back something unexpected.')
  }
  return body.data
}
