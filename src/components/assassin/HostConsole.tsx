import { ArrowLeft, Check, Download, Eye, EyeOff, Link2, LogOut } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import {
  adminEndVote,
  adminRemovePlayer,
  adminResetGame,
  adminSetRole,
  adminSetStatus,
} from '../../features/assassin/api/assassinApi'
import { resolveJoinUrl } from '../../features/assassin/utils/joinUrl'
import { useHostPlayers } from '../../features/assassin/hooks/useHostPlayers'
import type { AdminPlayer } from '../../features/assassin/types'
import { GraphQLRequestError } from '../../lib/graphql'
import { downloadDataUrl, generateQrDataUrl, getPublicUrl } from '../../lib/qrCode'
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard'
import { Button } from '../ui/Button'
import { IconButton } from '../ui/IconButton'
import { Modal } from '../ui/Modal'

interface HostConsoleProps {
  password: string
  onLogout: () => void
}

function joinUrl(): string {
  return resolveJoinUrl(import.meta.env.VITE_ASSASSIN_URL, getPublicUrl().url)
}

function describe(player: AdminPlayer): string {
  if (player.status === 'DEAD') {
    return player.deathReason === 'VOTED_OUT' ? 'Voted out' : player.deathReason === 'HOST' ? 'Eliminated by host' : 'Assassinated'
  }
  return player.present ? 'Alive' : 'Away'
}

export function HostConsole({ password, onLogout }: HostConsoleProps) {
  const { players, error, refresh } = useHostPlayers(password, onLogout)
  const [showRoles, setShowRoles] = useState(false)
  const [qr, setQr] = useState<string | null>(null)
  const [confirming, setConfirming] = useState<'reset' | { remove: AdminPlayer } | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const { copied, copy } = useCopyToClipboard()
  const url = useMemo(() => joinUrl(), [])

  useEffect(() => {
    let cancelled = false
    generateQrDataUrl(url)
      .then((result) => {
        if (!cancelled) setQr(result)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [url])

  const act = async (task: () => Promise<void>) => {
    setMessage(null)
    try {
      await task()
      await refresh()
    } catch (caught) {
      if (caught instanceof GraphQLRequestError && caught.kind === 'unauthorized') onLogout()
      setMessage(caught instanceof GraphQLRequestError ? caught.message : 'Something went wrong.')
    }
  }

  const assassins = players?.filter((p) => p.role === 'ASSASSIN' && p.status === 'ALIVE').length ?? 0
  const alive = players?.filter((p) => p.status === 'ALIVE').length ?? 0

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <Link
          to="/admin"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-plum px-4 text-sm font-semibold hover:bg-white/10"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Cards
        </Link>
        <IconButton label="Log out" onClick={onLogout}>
          <LogOut aria-hidden className="size-5" />
        </IconButton>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-5 pt-3 pb-12">
        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight">Assassin host</h1>
          <p className="mt-2 text-sm text-mist">
            {players ? `${players.length} guests · ${alive} alive · ${assassins} assassins alive` : 'Loading…'}
          </p>
        </div>

        <section className="rounded-3xl border border-white/10 bg-plum p-5 text-center">
          <h2 className="font-display text-xl font-bold">Door QR code</h2>
          <div className="mx-auto mt-4 w-fit rounded-3xl bg-white p-3">
            {qr ? (
              <img src={qr} alt={`QR code that opens ${url}`} className="size-56" />
            ) : (
              <div className="size-56" />
            )}
          </div>
          <p className="mt-3 text-sm break-all text-mist">{url}</p>
          <div className="mt-4 flex gap-3">
            <Button className="flex-1" onClick={() => void copy(url)} icon={copied ? <Check aria-hidden className="size-5" /> : <Link2 aria-hidden className="size-5" />}>
              {copied ? 'Copied' : 'Copy link'}
            </Button>
            <Button
              className="flex-1"
              disabled={!qr}
              onClick={() => qr && downloadDataUrl(qr, 'assassin-qr.png')}
              icon={<Download aria-hidden className="size-5" />}
            >
              Download
            </Button>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-xl font-bold">Guests</h2>
            <Button
              className="min-h-10 px-4 text-sm"
              onClick={() => setShowRoles((value) => !value)}
              icon={showRoles ? <EyeOff aria-hidden className="size-4" /> : <Eye aria-hidden className="size-4" />}
            >
              {showRoles ? 'Hide roles' : 'Show roles'}
            </Button>
          </div>
          <p className="text-sm text-mist">Roles are hidden by default so you can play too. Groups of 7 each have one assassin.</p>

          {(message ?? error) && (
            <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
              {message ?? error}
            </p>
          )}

          {players?.length === 0 && <p className="rounded-2xl border border-white/10 bg-plum p-5 text-center text-mist">Nobody has joined yet.</p>}
          <ul className="space-y-2">
            {players?.map((player) => (
              <li key={player.id} className="rounded-2xl border border-white/10 bg-plum p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className={`truncate font-semibold ${player.status === 'DEAD' ? 'line-through opacity-70' : ''}`}>{player.name}</p>
                    <p className="text-xs text-mist">
                      Group {player.group} · {describe(player)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold transition ${
                      showRoles
                        ? player.role === 'ASSASSIN'
                          ? 'border-hot/40 bg-hot/10 text-hot'
                          : 'border-white/10 text-mist'
                        : 'border-white/10 text-transparent blur-sm select-none'
                    }`}
                  >
                    {player.role === 'ASSASSIN' ? 'Assassin' : 'Innocent'}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    className="min-h-10 px-3 text-sm"
                    onClick={() => void act(() => adminSetStatus(password, player.id, player.status === 'ALIVE' ? 'DEAD' : 'ALIVE'))}
                  >
                    {player.status === 'ALIVE' ? 'Eliminate' : 'Revive'}
                  </Button>
                  <Button
                    className="min-h-10 px-3 text-sm"
                    onClick={() => void act(() => adminSetRole(password, player.id, player.role === 'ASSASSIN' ? 'INNOCENT' : 'ASSASSIN'))}
                  >
                    {player.role === 'ASSASSIN' ? 'Make innocent' : 'Make assassin'}
                  </Button>
                  <Button variant="danger" className="min-h-10 px-3 text-sm" onClick={() => setConfirming({ remove: player })}>
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Game controls</h2>
          <Button className="w-full" onClick={() => void act(() => adminEndVote(password))}>
            End the current vote
          </Button>
          <Button variant="danger" className="w-full" onClick={() => setConfirming('reset')}>
            Reset the whole game
          </Button>
        </section>
      </main>

      {confirming === 'reset' && (
        <Modal title="Reset the game?" onClose={() => setConfirming(null)}>
          <p className="text-mist">
            This removes every guest, vote and notice. Everyone will need to sign in again and will get new roles.
          </p>
          <div className="mt-5 flex gap-3">
            <Button className="flex-1" onClick={() => setConfirming(null)}>
              Keep playing
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => void act(() => adminResetGame(password)).then(() => setConfirming(null))}
            >
              Reset
            </Button>
          </div>
        </Modal>
      )}
      {confirming !== null && confirming !== 'reset' && (
        <Modal title={`Remove ${confirming.remove.name}?`} onClose={() => setConfirming(null)}>
          <p className="text-mist">They are removed from the game entirely and would need to sign in again.</p>
          <div className="mt-5 flex gap-3">
            <Button className="flex-1" onClick={() => setConfirming(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="flex-1"
              onClick={() => {
                const target = confirming.remove
                void act(() => adminRemovePlayer(password, target.id)).then(() => setConfirming(null))
              }}
            >
              Remove
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}
