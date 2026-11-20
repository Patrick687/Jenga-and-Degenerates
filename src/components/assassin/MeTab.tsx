import { Eye, EyeOff, LogIn, LogOut, ShieldCheck, Swords } from 'lucide-react'
import { useEffect, useState } from 'react'
import { assassinate, declineAssassin, leaveParty, returnToParty } from '../../features/assassin/api/assassinApi'
import type { AssassinGame } from '../../features/assassin/hooks/useAssassinGame'
import { useNow } from '../../features/assassin/hooks/useNow'
import type { AssassinState, PublicPlayer } from '../../features/assassin/types'
import { formatCountdown, minutesLabel, remainingMs } from '../../features/assassin/utils/time'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface MeTabProps {
  state: AssassinState
  run: AssassinGame['run']
}

/** The secret role, hidden until tapped and hidden again after a few seconds. */
function RolePeek({ role }: { role: 'ASSASSIN' | 'INNOCENT' }) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (!shown) return
    const timer = window.setTimeout(() => setShown(false), 5000)
    return () => window.clearTimeout(timer)
  }, [shown])

  const isAssassin = role === 'ASSASSIN'
  return (
    <button
      type="button"
      onClick={() => setShown((value) => !value)}
      className="flex w-full items-center gap-4 rounded-2xl border border-white/10 bg-plum p-4 text-left transition active:scale-[0.99]"
    >
      <span
        className={`inline-flex size-12 items-center justify-center rounded-xl ${
          shown ? (isAssassin ? 'bg-hot/15 text-hot' : 'bg-grape/15 text-grape') : 'bg-white/5 text-mist'
        }`}
      >
        {shown ? isAssassin ? <Swords aria-hidden /> : <ShieldCheck aria-hidden /> : <EyeOff aria-hidden />}
      </span>
      <span className="flex-1">
        <span className="block text-xs font-bold tracking-[0.14em] text-mist uppercase">Your secret role</span>
        <span className="block font-display text-2xl font-bold">
          {shown ? (isAssassin ? 'Assassin' : 'Innocent') : 'Tap to peek'}
        </span>
      </span>
      {shown && <Eye aria-hidden className="size-5 text-mist" />}
    </button>
  )
}

function TargetPicker({
  targets,
  onPick,
  onClose,
}: {
  targets: PublicPlayer[]
  onPick: (target: PublicPlayer) => Promise<string | null>
  onClose: () => void
}) {
  const [chosen, setChosen] = useState<PublicPlayer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const confirm = async () => {
    if (!chosen) return
    setPending(true)
    setError(null)
    const failure = await onPick(chosen)
    if (failure) {
      setError(failure)
      setPending(false)
    }
  }

  return (
    <Modal title={chosen ? `Strike ${chosen.name}?` : 'Who did you wink at?'} onClose={onClose}>
      {chosen ? (
        <div className="space-y-4">
          <p className="text-mist">
            Only do this after you&apos;ve actually winked at <strong className="text-paper">{chosen.name}</strong>. They
            will be told to die dramatically, and your cooldown starts.
          </p>
          {error && (
            <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setChosen(null)}>
              Back
            </Button>
            <Button variant="primary" className="flex-1" disabled={pending} onClick={() => void confirm()}>
              {pending ? 'Striking…' : 'Confirm kill'}
            </Button>
          </div>
        </div>
      ) : targets.length === 0 ? (
        <p className="text-mist">Nobody is available to target right now.</p>
      ) : (
        <ul className="space-y-2">
          {targets.map((target) => (
            <li key={target.id}>
              <button
                type="button"
                onClick={() => setChosen(target)}
                className="min-h-14 w-full rounded-2xl border border-white/10 bg-ink/50 px-4 text-left font-semibold transition hover:bg-white/10 active:scale-[0.99]"
              >
                {target.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export function MeTab({ state, run }: MeTabProps) {
  const { me } = state
  const now = useNow(1000)
  const [picking, setPicking] = useState(false)
  const [confirmingDecline, setConfirmingDecline] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isAssassin = me.role === 'ASSASSIN'
  const alive = me.status === 'ALIVE'
  const waitMs = me.nextKillAt === null ? 0 : remainingMs(me.nextKillAt, state.clockOffsetMs, now)
  const ready = waitMs === 0
  const cooldownMs = state.cooldownMinutes * 60_000
  const progress = ready ? 1 : Math.min(1, Math.max(0, 1 - waitMs / cooldownMs))
  const partnerIds = new Set(me.partners.map((partner) => partner.id))
  const targets = state.players.filter(
    (player) => player.id !== me.id && player.status === 'ALIVE' && player.present && !partnerIds.has(player.id),
  )

  const simpleAction = async (action: Parameters<typeof run>[0]) => {
    setBusy(true)
    setMessage(null)
    const failure = await run(action)
    setBusy(false)
    if (failure) setMessage(failure)
  }

  const strike = async (target: PublicPlayer): Promise<string | null> => {
    const failure = await run((token) => assassinate(token, target.id))
    if (!failure) setPicking(false)
    return failure
  }

  return (
    <div className="space-y-4">
      <RolePeek role={me.role} />

      {!alive && (
        <div className="rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-red-200">
          <p className="font-display text-xl font-bold">You&apos;re out</p>
          <p className="mt-1 text-sm">
            {me.deathReason === 'VOTED_OUT'
              ? 'You were voted out.'
              : me.deathReason === 'HOST'
                ? 'The host eliminated you.'
                : 'You were assassinated.'}{' '}
            You can still watch the game unfold.
          </p>
        </div>
      )}

      {alive && isAssassin && (
        <section className="space-y-4 rounded-2xl border border-hot/40 bg-hot/5 p-4">
          <div>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl font-bold">Next strike</h2>
              <span className={`font-display text-3xl font-bold tabular-nums ${ready ? 'text-hot' : 'text-paper'}`}>
                {ready ? 'Ready' : formatCountdown(waitMs)}
              </span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-hot transition-[width] duration-1000" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-2 text-xs text-mist">
              One strike every {minutesLabel(state.cooldownMinutes)}. Wink first, then log the kill here.
            </p>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!ready || !me.present}
            onClick={() => setPicking(true)}
            icon={<Swords aria-hidden className="size-6" />}
          >
            Log a kill
          </Button>
          {!me.present && <p className="text-sm text-tangerine">Mark yourself as back at the party to strike.</p>}

          <div>
            <h3 className="text-xs font-bold tracking-[0.14em] text-mist uppercase">Your fellow assassins</h3>
            {me.partners.length === 0 ? (
              <p className="mt-1 text-sm text-mist">None yet. More will appear as people arrive.</p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-2">
                {me.partners.map((partner) => (
                  <li
                    key={partner.id}
                    className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${
                      partner.status === 'DEAD' ? 'border-white/10 text-mist line-through' : 'border-hot/40 bg-hot/10 text-hot'
                    }`}
                  >
                    {partner.name}
                    {partner.status === 'DEAD' ? ' (out)' : !partner.present ? ' (away)' : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {me.canDecline &&
            (confirmingDecline ? (
              <div className="space-y-3 rounded-2xl border border-white/10 bg-plum p-4">
                <p className="text-sm text-mist">Someone else in your group will be chosen instead. Are you sure?</p>
                <div className="flex gap-3">
                  <Button className="flex-1" onClick={() => setConfirmingDecline(false)}>
                    Keep it
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    disabled={busy}
                    onClick={() => void simpleAction((token) => declineAssassin(token)).then(() => setConfirmingDecline(false))}
                  >
                    Not for me
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" className="w-full" onClick={() => setConfirmingDecline(true)}>
                I don&apos;t want to be an assassin
              </Button>
            ))}
        </section>
      )}

      {alive && !isAssassin && (
        <section className="rounded-2xl border border-white/10 bg-plum p-4 text-sm text-mist">
          <p className="font-display text-lg font-bold text-paper">How to survive</p>
          <ul className="mt-2 space-y-1.5">
            <li>• If an assassin winks at you, die dramatically wherever you are.</li>
            <li>• Watch who is winking. Call a vote when you have a suspect.</li>
            <li>• {state.stats.assassinsAlive} assassin{state.stats.assassinsAlive === 1 ? '' : 's'} still at large.</li>
          </ul>
        </section>
      )}

      {message && (
        <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
          {message}
        </p>
      )}

      <Button
        variant="secondary"
        className="w-full"
        disabled={busy}
        onClick={() => void simpleAction((token) => (me.present ? leaveParty(token) : returnToParty(token)))}
        icon={me.present ? <LogOut aria-hidden className="size-5" /> : <LogIn aria-hidden className="size-5" />}
      >
        {me.present ? "I'm leaving the party" : "I'm back at the party"}
      </Button>

      {picking && <TargetPicker targets={targets} onPick={strike} onClose={() => setPicking(false)} />}
    </div>
  )
}
