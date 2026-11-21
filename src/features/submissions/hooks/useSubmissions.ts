import { useCallback, useEffect, useState } from 'react'
import { GraphQLRequestError } from '../../../lib/graphql'
import { fetchSubmissions } from '../api/submissionsApi'
import type { Submission } from '../types'

const POLL_MS = 5000

/** The host's live suggestion box. Lives above the tabs so the badge stays current. */
export function useSubmissions(password: string, onUnauthorized: () => void) {
  const [submissions, setSubmissions] = useState<Submission[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setSubmissions(await fetchSubmissions(password))
      setError(null)
    } catch (caught) {
      if (caught instanceof GraphQLRequestError && caught.kind === 'unauthorized') onUnauthorized()
      setError(caught instanceof GraphQLRequestError ? caught.message : 'Could not load suggestions.')
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

  return { submissions, error, refresh }
}
