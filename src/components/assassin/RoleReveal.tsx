import { ShieldCheck, Swords } from 'lucide-react'
import { useState } from 'react'
import type { Me } from '../../features/assassin/types'
import { minutesLabel } from '../../features/assassin/utils/time'
import { Button } from '../ui/Button'

interface RoleRevealProps {
  me: Me
  cooldownMinutes: number
  onContinue: () => void
  /** Resolves to an error message, or null once declined. */
  onDecline: () => Promise<string | null>
}

/** The private "this is who you are" moment, shown once after joining. */
export function RoleReveal({ me, cooldownMinutes, onContinue, onDecline }: RoleRevealProps) {
  const [revealed, setRevealed] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const isAssassin = me.role === 'ASSASSIN'

  const decline = async () => {
    setPending(true)
    setError(null)
    const failure = await onDecline()
    setPending(false)
    if (failure) setError(failure)
    else {
      setConfirming(false)
      onContinue()
    }
  }

  if (!revealed) {
    return (
      <main className="flex flex-1 flex-col justify-center gap-6 px-5 py-10 text-center">
        <p className="animate-fade-up text-sm font-semibold tracking-[0.2em] text-mist uppercase">Your secret role</p>
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mx-auto flex aspect-[3/4] w-64 animate-card-in flex-col items-center justify-center gap-4 rounded-[2rem] border border-white/15 bg-plum p-6 shadow-[0_0_90px_-24px_rgba(167,139,250,0.65)] transition active:scale-95"
        >
          <span className="font-display text-7xl text-grape">?</span>
          <span className="font-display text-xl font-bold">Tap to reveal</span>
          <span className="text-sm text-mist">Make sure nobody is looking.</span>
        </button>
      </main>
    )
  }

  const Icon = isAssassin ? Swords : ShieldCheck
  return (
    <main className="flex flex-1 flex-col justify-center gap-6 px-5 py-10">
      <div
        className={`animate-card-in rounded-[2rem] border p-7 text-center ${
          isAssassin
            ? 'border-hot/60 bg-hot/10 shadow-[0_0_90px_-24px_rgba(244,90,167,0.7)]'
            : 'border-grape/50 bg-grape/10 shadow-[0_0_90px_-24px_rgba(167,139,250,0.6)]'
        }`}
      >
        <Icon aria-hidden className={`mx-auto size-16 ${isAssassin ? 'text-hot' : 'text-grape'}`} />
        <h1 className="mt-4 font-display text-5xl font-bold tracking-tighter">{isAssassin ? 'Assassin' : 'Innocent'}</h1>
        {isAssassin ? (
          <div className="mt-4 space-y-3 text-left text-mist">
            <p>
              Wink at someone to eliminate them, then log the kill in the app. You can only strike once every{' '}
              {minutesLabel(cooldownMinutes)}, starting {minutesLabel(cooldownMinutes)} from now.
            </p>
            <p>
              {me.partners.length > 0 ? (
                <>
                  Your fellow assassins: <strong className="text-paper">{me.partners.map((p) => p.name).join(', ')}</strong>.
                </>
              ) : (
                'No other assassins yet. More will appear as people arrive.'
              )}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-left text-mist">
            Stay alive, watch for winks, and help the room vote out the assassins. If one winks at you, die dramatically.
          </p>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {confirming ? (
        <div className="space-y-3 rounded-2xl border border-white/10 bg-plum p-4">
          <p className="text-sm text-mist">Someone else in your group will be chosen instead. Are you sure?</p>
          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
            <Button variant="danger" className="flex-1" disabled={pending} onClick={() => void decline()}>
              {pending ? 'One sec…' : 'Not for me'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Button variant="primary" size="lg" className="w-full" onClick={onContinue}>
            Got it
          </Button>
          {isAssassin && me.canDecline && (
            <Button variant="ghost" className="w-full" onClick={() => setConfirming(true)}>
              I don&apos;t want to be an assassin
            </Button>
          )}
        </div>
      )}
    </main>
  )
}
