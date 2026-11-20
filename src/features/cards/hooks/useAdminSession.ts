import { useCallback, useEffect, useState } from 'react'
import { GraphQLRequestError } from '../../../lib/graphql'
import { readSessionString, removeSessionKey, writeSessionString } from '../../../lib/sessionStorage'
import { verifyAdminPassword } from '../api/cardsApi'

const SESSION_KEY = 'jenga-and-degenerates:admin-password'

type Session =
  | { status: 'logged-out' }
  | { status: 'checking'; password: string }
  | { status: 'authenticated'; password: string }

function errorMessage(error: unknown): string {
  return error instanceof GraphQLRequestError ? error.message : 'Something went wrong. Try again.'
}

/**
 * Holds the admin password for this browser tab only (sessionStorage), and
 * checks it with the server before the manager is shown.
 */
export function useAdminSession() {
  const [session, setSession] = useState<Session>(() => {
    const saved = readSessionString(SESSION_KEY)
    return saved ? { status: 'checking', password: saved } : { status: 'logged-out' }
  })

  const logout = useCallback(() => {
    removeSessionKey(SESSION_KEY)
    setSession({ status: 'logged-out' })
  }, [])

  // Re-check a password restored from an earlier visit in this tab.
  useEffect(() => {
    if (session.status !== 'checking') return
    let cancelled = false
    verifyAdminPassword(session.password).then(
      () => {
        if (!cancelled) setSession({ status: 'authenticated', password: session.password })
      },
      () => {
        if (cancelled) return
        removeSessionKey(SESSION_KEY)
        setSession({ status: 'logged-out' })
      },
    )
    return () => {
      cancelled = true
    }
  }, [session])

  /** Resolves to an error message to show on the form, or null on success. */
  const login = useCallback(async (password: string): Promise<string | null> => {
    try {
      await verifyAdminPassword(password)
    } catch (error) {
      return errorMessage(error)
    }
    writeSessionString(SESSION_KEY, password)
    setSession({ status: 'authenticated', password })
    return null
  }, [])

  return { session, login, logout }
}
