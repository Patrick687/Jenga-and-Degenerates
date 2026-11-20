import { describe, expect, it } from 'vitest'
import { GraphQLRequestError, parseGraphQLErrors } from './graphql'

describe('parseGraphQLErrors', () => {
  it('detects a wrong or missing password', () => {
    const error = parseGraphQLErrors([
      { message: 'Wrong or missing admin password.', extensions: { code: 'UNAUTHENTICATED' } },
    ])
    expect(error).toBeInstanceOf(GraphQLRequestError)
    expect(error.kind).toBe('unauthorized')
  })

  it('detects rate limiting', () => {
    const error = parseGraphQLErrors([
      {
        message: 'Too many wrong passwords. Try again in a few minutes.',
        extensions: { code: 'INTERNAL_SERVER_ERROR', originalError: { statusCode: 429 } },
      },
    ])
    expect(error.kind).toBe('rate-limited')
  })

  it('uses the readable validation text', () => {
    const error = parseGraphQLErrors([
      {
        message: 'Bad Request Exception',
        extensions: { code: 'BAD_REQUEST', originalError: { message: ['Card text is too short.'] } },
      },
    ])
    expect(error.kind).toBe('validation')
    expect(error.message).toBe('Card text is too short.')
  })

  it('falls back to a server error for anything else', () => {
    expect(parseGraphQLErrors([{ message: 'Card "x" was not found.' }]).message).toBe('Card "x" was not found.')
    expect(parseGraphQLErrors(undefined).kind).toBe('server')
    expect(parseGraphQLErrors([42]).kind).toBe('server')
  })
})
