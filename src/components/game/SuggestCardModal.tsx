import { Modal } from '../ui/Modal'
import { SuggestCardForm } from '../submit/SuggestCardForm'

export function SuggestCardModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="Add a card" onClose={onClose}>
      <p className="mb-5 text-mist">Got a good one? It goes straight into the deck for everyone.</p>
      <SuggestCardForm />
    </Modal>
  )
}
