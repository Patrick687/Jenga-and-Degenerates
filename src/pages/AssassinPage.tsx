import { useState } from 'react'
import { JoinScreen } from '../components/assassin/JoinScreen'
import { PartyScreen } from '../components/assassin/PartyScreen'
import { RoleReveal } from '../components/assassin/RoleReveal'
import { WelcomeSplash } from '../components/assassin/WelcomeSplash'
import { AppShell } from '../components/layout/AppShell'
import { declineAssassin } from '../features/assassin/api/assassinApi'
import { useAssassinGame } from '../features/assassin/hooks/useAssassinGame'
import { readJson, writeJson } from '../lib/storage'

const roleSeenKey = (id: string) => `jenga-and-degenerates:assassin-role-seen:${id}`

type Intro = 'welcome' | 'role' | 'done'

export function AssassinPage() {
  const game = useAssassinGame()
  const { state } = game
  // After signing in: welcome animation, then the private role reveal, then the game.
  const [intro, setIntro] = useState<Intro | null>(null)

  const roleSeen = state ? readJson(roleSeenKey(state.me.id)) === true : false
  const stage: Intro = intro ?? (roleSeen ? 'done' : 'role')

  const finishIntro = () => {
    if (state) writeJson(roleSeenKey(state.me.id), true)
    setIntro('done')
  }

  const join = async (name: string) => {
    const failure = await game.join(name)
    if (!failure) setIntro('welcome')
    return failure
  }

  let content
  if (game.loading) {
    content = <p className="flex flex-1 items-center justify-center text-mist">Finding your seat…</p>
  } else if (!state) {
    content = <JoinScreen onJoin={join} />
  } else if (stage === 'welcome') {
    content = <WelcomeSplash name={state.me.name} onDone={() => setIntro('role')} />
  } else if (stage === 'role') {
    content = (
      <RoleReveal
        me={state.me}
        cooldownMinutes={state.cooldownMinutes}
        onContinue={finishIntro}
        onDecline={() => game.run((token) => declineAssassin(token))}
      />
    )
  } else {
    content = <PartyScreen state={state} game={game} />
  }

  return <AppShell>{content}</AppShell>
}
