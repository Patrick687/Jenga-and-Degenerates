import type { AssassinState, PublicPlayer } from '../../features/assassin/types'

function reasonText(player: PublicPlayer): string {
  if (player.deathReason === 'VOTED_OUT') {
    return `Voted out${player.revealedRole ? ` · was ${player.revealedRole === 'ASSASSIN' ? 'an assassin' : 'innocent'}` : ''}`
  }
  if (player.deathReason === 'HOST') return 'Eliminated by the host'
  return 'Assassinated'
}

function Section({ title, players, children }: { title: string; players: PublicPlayer[]; children: (player: PublicPlayer) => React.ReactNode }) {
  if (players.length === 0) return null
  return (
    <section>
      <h2 className="mb-2 text-xs font-bold tracking-[0.14em] text-mist uppercase">
        {title} · {players.length}
      </h2>
      <ul className="space-y-2">{players.map((player) => children(player))}</ul>
    </section>
  )
}

export function PlayersTab({ state }: { state: AssassinState }) {
  const byName = (a: PublicPlayer, b: PublicPlayer) => a.name.localeCompare(b.name)
  const here = state.players.filter((p) => p.status === 'ALIVE' && p.present).sort(byName)
  const away = state.players.filter((p) => p.status === 'ALIVE' && !p.present).sort(byName)
  const dead = state.players.filter((p) => p.status === 'DEAD').sort(byName)
  const partnerIds = new Set(state.me.partners.map((partner) => partner.id))

  const row = (player: PublicPlayer, detail?: string) => (
    <li
      key={player.id}
      className={`flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-plum px-4 py-3 ${
        player.status === 'DEAD' ? 'opacity-70' : ''
      }`}
    >
      <span className="min-w-0">
        <span className={`block truncate font-semibold ${player.status === 'DEAD' ? 'line-through' : ''}`}>
          {player.name}
          {player.id === state.me.id && <span className="ml-2 text-xs font-normal text-mist">(you)</span>}
        </span>
        {detail && <span className="block text-xs text-mist">{detail}</span>}
      </span>
      {partnerIds.has(player.id) && (
        <span className="shrink-0 rounded-full border border-hot/40 bg-hot/10 px-2.5 py-1 text-xs font-bold text-hot">
          Assassin
        </span>
      )}
    </li>
  )

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: 'Alive', value: state.stats.alive, tone: 'text-paper' },
          { label: 'Out', value: state.stats.dead, tone: 'text-red-300' },
          { label: 'Assassins left', value: state.stats.assassinsAlive, tone: 'text-hot' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/10 bg-plum p-3">
            <p className={`font-display text-3xl font-bold ${stat.tone}`}>{stat.value}</p>
            <p className="text-xs text-mist">{stat.label}</p>
          </div>
        ))}
      </div>

      {state.players.length === 0 && <p className="text-center text-mist">Nobody here yet.</p>}
      <Section title="Alive" players={here}>
        {(player) => row(player)}
      </Section>
      <Section title="Left the party" players={away}>
        {(player) => row(player, 'Away. Not in play until they return.')}
      </Section>
      <Section title="Out" players={dead}>
        {(player) => row(player, reasonText(player))}
      </Section>
    </div>
  )
}
