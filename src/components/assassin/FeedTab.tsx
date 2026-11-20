import { useNow } from '../../features/assassin/hooks/useNow'
import type { AssassinState } from '../../features/assassin/types'
import { timeAgo } from '../../features/assassin/utils/time'

export function FeedTab({ state }: { state: AssassinState }) {
  const now = useNow(15_000) + state.clockOffsetMs

  if (state.events.length === 0) return <p className="text-center text-mist">Nothing has happened yet.</p>
  return (
    <ul className="space-y-2">
      {state.events.map((event) => (
        <li
          key={event.id}
          className={`rounded-2xl border p-4 ${
            event.isPrivate ? 'border-hot/40 bg-hot/10' : 'border-white/10 bg-plum'
          }`}
        >
          {event.isPrivate && <p className="mb-1 text-xs font-bold tracking-[0.14em] text-hot uppercase">Just for you</p>}
          <p>{event.message}</p>
          <p className="mt-1 text-xs text-mist">{timeAgo(event.createdAt, now)}</p>
        </li>
      ))}
    </ul>
  )
}
