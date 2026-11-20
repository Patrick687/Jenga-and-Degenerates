import { Check, Vote } from 'lucide-react'
import { useState } from 'react'
import { castVote, endVote, startVote } from '../../features/assassin/api/assassinApi'
import type { AssassinGame } from '../../features/assassin/hooks/useAssassinGame'
import { useNow } from '../../features/assassin/hooks/useNow'
import type { AssassinState } from '../../features/assassin/types'
import { formatCountdown, remainingMs } from '../../features/assassin/utils/time'
import { Button } from '../ui/Button'

interface VoteTabProps {
  state: AssassinState
  run: AssassinGame['run']
}

export function VoteTab({ state, run }: VoteTabProps) {
  const { me, vote } = state
  const now = useNow(1000)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const canVote = me.status === 'ALIVE' && me.present

  const go = async (action: Parameters<typeof run>[0]) => {
    setBusy(true)
    setError(null)
    const failure = await run(action)
    setBusy(false)
    if (failure) setError(failure)
  }

  const errorBox = error && (
    <p role="alert" className="rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
      {error}
    </p>
  )

  if (!vote) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-white/10 bg-plum p-5">
          <Vote aria-hidden className="size-8 text-grape" />
          <h2 className="mt-3 font-display text-2xl font-bold">No vote right now</h2>
          <p className="mt-2 text-mist">
            Think you know who an assassin is? Call a vote. Every living guest can join, and whoever gets the majority is
            voted out and revealed.
          </p>
        </div>
        {errorBox}
        <Button
          variant="primary"
          size="lg"
          className="w-full"
          disabled={!canVote || busy}
          onClick={() => void go((token) => startVote(token))}
        >
          Call a vote
        </Button>
        {!canVote && (
          <p className="text-center text-sm text-mist">
            {me.status === 'DEAD' ? 'Dead guests can watch, but not vote.' : 'Mark yourself as back at the party to vote.'}
          </p>
        )}
      </div>
    )
  }

  const left = remainingMs(vote.endsAt, state.clockOffsetMs, now)
  const candidates = state.players
    .filter((player) => player.id !== me.id && player.status === 'ALIVE' && player.present)
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-grape/50 bg-grape/10 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">Vote in progress</h2>
          <span className="font-display text-3xl font-bold tabular-nums text-grape">
            {left > 0 ? formatCountdown(left) : '0:00'}
          </span>
        </div>
        <p className="mt-2 text-sm text-mist">
          Called by {vote.startedByName}. {vote.ballotsCast} of {vote.eligibleVoters} living guests have voted. A pick
          needs at least two votes and a majority.
        </p>
      </div>

      {errorBox}

      {canVote ? (
        <ul className="space-y-2" aria-label="Who is an assassin?">
          {candidates.map((candidate) => {
            const mine = vote.myCandidateId === candidate.id
            return (
              <li key={candidate.id}>
                <button
                  type="button"
                  aria-pressed={mine}
                  disabled={busy}
                  onClick={() => void go((token) => castVote(token, vote.id, candidate.id))}
                  className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 text-left font-semibold transition active:scale-[0.99] ${
                    mine ? 'border-grape bg-grape text-ink' : 'border-white/10 bg-plum hover:bg-white/10'
                  }`}
                >
                  {candidate.name}
                  {mine && <Check aria-hidden className="size-5" />}
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-plum p-4 text-center text-mist">
          {me.status === 'DEAD' ? 'You can watch, but dead guests can’t vote.' : 'Mark yourself as back at the party to vote.'}
        </p>
      )}

      {vote.startedByMe && (
        <Button className="w-full" disabled={busy} onClick={() => void go((token) => endVote(token))}>
          End the vote now
        </Button>
      )}
    </div>
  )
}
