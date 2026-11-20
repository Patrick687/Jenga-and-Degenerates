import { useState } from 'react'
import type { Prompt } from '../../features/game/types/game.types'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface DeleteCardModalProps {
  card: Prompt
  /** Resolves to an error message to show, or null once deleted. */
  onConfirm: () => Promise<string | null>
  onClose: () => void
}

export function DeleteCardModal({ card, onConfirm, onClose }: DeleteCardModalProps) {
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const confirm = async () => {
    setPending(true)
    setError(null)
    const failure = await onConfirm()
    if (failure) {
      setError(failure)
      setPending(false)
    }
  }

  return (
    <Modal title="Delete this card?" onClose={onClose}>
      <p className="rounded-2xl border border-white/10 bg-ink/50 p-4 text-lg leading-snug">{card.text}</p>
      <p className="mt-3 text-sm text-mist">It disappears from the game for everyone. This can&apos;t be undone.</p>
      {error && (
        <p role="alert" className="mt-4 rounded-2xl border border-red-400/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <Button className="flex-1" onClick={onClose}>
          Keep it
        </Button>
        <Button variant="danger" className="flex-1" disabled={pending} onClick={() => void confirm()}>
          {pending ? 'Deleting…' : 'Delete'}
        </Button>
      </div>
    </Modal>
  )
}
