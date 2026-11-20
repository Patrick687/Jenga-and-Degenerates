import { Skull } from 'lucide-react'
import type { DeathReason } from '../../features/assassin/types'
import { Button } from '../ui/Button'

interface DeathOverlayProps {
  reason: DeathReason | null
  onDone: () => void
}

/** Full-screen "you died" moment. The dramatic death itself happens in the real room. */
export function DeathOverlay({ reason, onDone }: DeathOverlayProps) {
  const votedOut = reason === 'VOTED_OUT'
  return (
    <div
      role="alertdialog"
      aria-labelledby="death-title"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-red-950/95 px-6 text-center backdrop-blur"
    >
      <Skull aria-hidden className="size-24 animate-shake text-red-300" />
      <div>
        <h2 id="death-title" className="font-display text-5xl font-bold tracking-tighter">
          {votedOut ? 'Voted out' : "You're dead"}
        </h2>
        <p className="mt-4 text-lg text-red-100/80">
          {votedOut
            ? 'The room has spoken. Make your exit as dramatic as you like.'
            : 'You were winked at. Perform a dramatic death, right where you are.'}
        </p>
      </div>
      <Button variant="primary" size="lg" onClick={onDone}>
        I died dramatically
      </Button>
    </div>
  )
}
