import { Volume2, VolumeX, WifiOff } from 'lucide-react'
import { useState } from 'react'
import type { AssassinGame } from '../../features/assassin/hooks/useAssassinGame'
import type { AssassinState } from '../../features/assassin/types'
import { readJson, writeJson } from '../../lib/storage'
import { IconButton } from '../ui/IconButton'
import { AlertStack } from './AlertStack'
import { DeathOverlay } from './DeathOverlay'
import { FeedTab } from './FeedTab'
import { MeTab } from './MeTab'
import { PlayersTab } from './PlayersTab'
import { TabBar, type TabId } from './TabBar'
import { VoteTab } from './VoteTab'

interface PartyScreenProps {
  state: AssassinState
  game: AssassinGame
}

const deathKey = (id: string) => `jenga-and-degenerates:assassin-death-seen:${id}`

export function PartyScreen({ state, game }: PartyScreenProps) {
  const [tab, setTab] = useState<TabId>('me')
  const [deathSeen, setDeathSeen] = useState(() => readJson(deathKey(state.me.id)) === true)
  const { me } = state

  const showDeath = me.status === 'DEAD' && !deathSeen
  const acknowledgeDeath = () => {
    writeJson(deathKey(me.id), true)
    setDeathSeen(true)
  }

  return (
    <>
      <AlertStack alerts={game.alerts} onDismiss={game.dismissAlert} />
      {showDeath && <DeathOverlay reason={me.deathReason} onDone={acknowledgeDeath} />}

      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <div className="min-w-0">
          <p className="text-xs font-bold tracking-[0.14em] text-mist uppercase">Assassin game</p>
          <p className="truncate font-display text-2xl font-bold">{me.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {game.offline && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-tangerine/40 bg-tangerine/10 px-3 py-1.5 text-xs font-semibold text-tangerine">
              <WifiOff aria-hidden className="size-4" />
              Reconnecting
            </span>
          )}
          <IconButton label={game.soundOn ? 'Mute alert sounds' : 'Turn alert sounds on'} onClick={game.toggleSound}>
            {game.soundOn ? <Volume2 aria-hidden className="size-5" /> : <VolumeX aria-hidden className="size-5" />}
          </IconButton>
        </div>
      </header>

      <main className="flex-1 px-5 pt-3 pb-28">
        {tab === 'me' && <MeTab state={state} run={game.run} />}
        {tab === 'players' && <PlayersTab state={state} />}
        {tab === 'vote' && <VoteTab state={state} run={game.run} />}
        {tab === 'feed' && <FeedTab state={state} />}
      </main>

      <TabBar active={tab} onChange={setTab} badges={{ vote: state.vote !== null && tab !== 'vote' }} />
    </>
  )
}
