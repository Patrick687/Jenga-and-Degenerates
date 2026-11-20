import { useCallback, useEffect, useRef, useState } from 'react'
import { GraphQLRequestError } from '../../../lib/graphql'
import { readJson, removeKey, writeJson } from '../../../lib/storage'
import { fetchState, joinParty } from '../api/assassinApi'
import type { AssassinState } from '../types'
import { deriveEventAlerts, latestEventId, playFeedback, unlockAudio, type PartyAlert } from '../utils/alerts'
import { remainingMs } from '../utils/time'

const TOKEN_KEY = 'jenga-and-degenerates:assassin-token'
const LAST_EVENT_KEY = 'jenga-and-degenerates:assassin-last-event'
const SOUND_KEY = 'jenga-and-degenerates:assassin-sound'
const POLL_MS = 3000
const MAX_ALERTS = 4

function readToken(): string | null {
  const value = readJson(TOKEN_KEY)
  return typeof value === 'string' && value ? value : null
}

function readLastEvent(): number | null {
  const value = readJson(LAST_EVENT_KEY)
  return typeof value === 'number' ? value : null
}

function errorText(error: unknown): string {
  return error instanceof GraphQLRequestError ? error.message : 'Something went wrong. Try again.'
}

/**
 * Everything the player screens need: who you are, the live party state
 * (refreshed every few seconds), alerts for things that happen, and actions.
 */
export function useAssassinGame() {
  const [token, setToken] = useState<string | null>(readToken)
  const [state, setState] = useState<AssassinState | null>(null)
  const [loading, setLoading] = useState(() => readToken() !== null)
  const [offline, setOffline] = useState(false)
  const [alerts, setAlerts] = useState<PartyAlert[]>([])
  const [soundOn, setSoundOn] = useState(() => readJson(SOUND_KEY) !== false)

  const soundRef = useRef(soundOn)
  const stateRef = useRef<AssassinState | null>(null)
  const lastEventRef = useRef<number | null>(readLastEvent())
  useEffect(() => {
    soundRef.current = soundOn
  }, [soundOn])

  const pushAlerts = useCallback((fresh: PartyAlert[]) => {
    if (fresh.length === 0) return
    setAlerts((current) => {
      const known = new Set(current.map((alert) => alert.id))
      return [...current, ...fresh.filter((alert) => !known.has(alert.id))].slice(-MAX_ALERTS)
    })
    const tone = fresh.some((a) => a.tone === 'danger') ? 'danger' : fresh.some((a) => a.tone === 'ready') ? 'ready' : 'info'
    playFeedback(tone, soundRef.current)
  }, [])

  const apply = useCallback(
    (next: AssassinState) => {
      stateRef.current = next
      setState(next)
      setOffline(false)

      const newest = latestEventId(next.events)
      const lastSeen = lastEventRef.current
      if (lastSeen === null) {
        // First look at this game on this device: nothing counts as news yet.
        lastEventRef.current = newest
        writeJson(LAST_EVENT_KEY, newest)
      } else if (newest > lastSeen) {
        lastEventRef.current = newest
        writeJson(LAST_EVENT_KEY, newest)
        pushAlerts(deriveEventAlerts(next.events, lastSeen))
      }
    },
    [pushAlerts],
  )

  const forget = useCallback(() => {
    removeKey(TOKEN_KEY)
    removeKey(LAST_EVENT_KEY)
    lastEventRef.current = null
    stateRef.current = null
    setToken(null)
    setState(null)
    setAlerts([])
    setLoading(false)
  }, [])

  // Keep the state fresh while the page is open.
  useEffect(() => {
    if (!token) return
    let cancelled = false
    let controller: AbortController | null = null

    const refresh = async () => {
      controller?.abort()
      const current = new AbortController()
      controller = current
      try {
        const next = await fetchState(token, current.signal)
        if (!cancelled) apply(next)
      } catch (error) {
        if (cancelled || current.signal.aborted) return
        if (error instanceof GraphQLRequestError && error.kind === 'unauthorized') {
          forget()
          return
        }
        setOffline(true)
      } finally {
        if (!cancelled && !current.signal.aborted) setLoading(false)
      }
    }

    void refresh()
    const interval = window.setInterval(() => {
      if (!document.hidden) void refresh()
    }, POLL_MS)
    const onVisible = () => {
      if (!document.hidden) void refresh()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      cancelled = true
      controller?.abort()
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [token, apply, forget])

  // Tell assassins the moment their cooldown ends.
  const nextKillAt = state?.me.role === 'ASSASSIN' && state.me.status === 'ALIVE' ? state.me.nextKillAt : null
  useEffect(() => {
    if (nextKillAt === null) return
    const offset = stateRef.current?.clockOffsetMs ?? 0
    const wait = remainingMs(nextKillAt, offset)
    if (wait <= 0) return
    const timer = window.setTimeout(() => {
      pushAlerts([
        {
          id: `ready-${nextKillAt}`,
          tone: 'ready',
          title: 'You can strike again',
          message: 'Your cooldown is over. Pick your moment.',
        },
      ])
    }, wait + 250)
    return () => window.clearTimeout(timer)
  }, [nextKillAt, pushAlerts])

  const join = useCallback(
    async (name: string): Promise<string | null> => {
      unlockAudio()
      try {
        const result = await joinParty(name)
        removeKey(LAST_EVENT_KEY)
        lastEventRef.current = null
        writeJson(TOKEN_KEY, result.token)
        setToken(result.token)
        apply(result.state)
        setLoading(false)
        return null
      } catch (error) {
        return errorText(error)
      }
    },
    [apply],
  )

  /** Runs an action; resolves to an error message, or null on success. */
  const run = useCallback(
    async (action: (token: string) => Promise<AssassinState>): Promise<string | null> => {
      if (!token) return 'Join the party first.'
      try {
        apply(await action(token))
        return null
      } catch (error) {
        if (error instanceof GraphQLRequestError && error.kind === 'unauthorized') forget()
        return errorText(error)
      }
    },
    [token, apply, forget],
  )

  const dismissAlert = useCallback((id: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== id))
  }, [])

  const toggleSound = useCallback(() => {
    unlockAudio()
    setSoundOn((current) => {
      writeJson(SOUND_KEY, !current)
      return !current
    })
  }, [])

  return { token, state, loading, offline, alerts, dismissAlert, soundOn, toggleSound, join, run }
}

export type AssassinGame = ReturnType<typeof useAssassinGame>
