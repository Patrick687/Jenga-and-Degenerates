import { Dices, SkipForward } from 'lucide-react'
import { Button } from '../ui/Button'

interface GameControlsProps {
  hasPrompt: boolean
  onNext: () => void
  onPass: () => void
}

/** Thumb-reach action bar pinned to the bottom of the screen. */
export function GameControls({ hasPrompt, onNext, onPass }: GameControlsProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink via-ink/95 to-transparent pt-10 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-xl gap-3 px-5">
        {hasPrompt && (
          <Button size="lg" onClick={onPass} icon={<SkipForward aria-hidden className="size-5" />}>
            Pass
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={onNext}
          className="flex-1"
          icon={<Dices aria-hidden className="size-6" />}
        >
          {hasPrompt ? 'Next Block' : 'Pull Your Block'}
        </Button>
      </div>
    </div>
  )
}
