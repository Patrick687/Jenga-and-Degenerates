import { useCallback, useEffect, useState } from 'react'
import { GraphQLRequestError } from '../../../lib/graphql'
import { fetchAdminPlayers } from '../api/assassinApi'
import type { AdminPlayer } from '../types'

const POLL_MS = 4000

/** The host's live view of every guest, including secret roles. */
export function useHostPlayers(password: string, onUnauthorized: () => void) {
  const [players, setPlayers] = useState<AdminPlayer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setPlayers(await fetchAdminPlayers(password))
      setError(null)
    } catch (caught) {
      if (caught instanceof GraphQLRequestError && caught.kind === 'unauthorized') onUnauthorized()
      setError(caught instanceof GraphQLRequestError ? caught.message : 'Could not load the guests.')
    }
  }, [password, onUnauthorized])

  useEffect(() => {
    const first = window.setTimeout(() => void refresh(), 0)
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_MS)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(interval)
    }
  }, [refresh])

  return { players, error, refresh }
}
