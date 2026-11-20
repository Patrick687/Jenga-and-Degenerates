import { useState } from 'react'
import { CategorySelector } from '../components/game/CategorySelector'
import { GameControls } from '../components/game/GameControls'
import { HeroPanel } from '../components/game/HeroPanel'
import { HowToPlayModal } from '../components/game/HowToPlayModal'
import { PromptCard } from '../components/game/PromptCard'
import { PromptHistory } from '../components/game/PromptHistory'
import { QRCodeModal } from '../components/game/QRCodeModal'
import { SpicyModeToggle } from '../components/game/SpicyModeToggle'
import { TitleBlock } from '../components/game/TitleBlock'
import { AppShell } from '../components/layout/AppShell'
import { Header } from '../components/layout/Header'
import { usePromptGenerator } from '../features/game/hooks/usePromptGenerator'
import { usePrompts } from '../features/game/hooks/usePrompts'

type Panel = 'history' | 'qr' | 'help' | null

export function GamePage() {
  const prompts = usePrompts()
  const game = usePromptGenerator({ prompts })
  const [panel, setPanel] = useState<Panel>(null)
  const closePanel = () => setPanel(null)

  const withHaptics = (action: () => void) => () => {
    navigator.vibrate?.(12)
    action()
  }

  return (
    <AppShell>
      <Header
        historyCount={game.history.length}
        onOpenHistory={() => setPanel('history')}
        onOpenQr={() => setPanel('qr')}
        onOpenHelp={() => setPanel('help')}
      />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-3 pb-40">
        <TitleBlock compact={game.current !== null} />
        <CategorySelector mode={game.mode} onChange={game.setMode} />

        {game.current ? <PromptCard entry={game.current} /> : <HeroPanel />}

        {game.isEmpty && (
          <p role="alert" className="rounded-2xl border border-white/10 bg-plum p-4 text-center text-mist">
            No prompts match these settings. Try another mode or turn up the heat.
          </p>
        )}

        <SpicyModeToggle enabled={game.spicy} onChange={game.setSpicy} />
      </main>

      <GameControls hasPrompt={game.current !== null} onNext={withHaptics(game.next)} onPass={withHaptics(game.pass)} />

      {panel === 'history' && <PromptHistory history={game.history} onReset={game.reset} onClose={closePanel} />}
      {panel === 'qr' && <QRCodeModal onClose={closePanel} />}
      {panel === 'help' && <HowToPlayModal onClose={closePanel} />}
    </AppShell>
  )
}
