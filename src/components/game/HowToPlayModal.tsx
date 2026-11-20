import { Link } from 'react-router'
import { Modal } from '../ui/Modal'

const STEPS = [
  'Pull a Jenga block.',
  'Open this app. Pick Truth, Dare, Chaos, or Random.',
  'Do the prompt.',
  'Pass if you want. No explanation needed.',
  'Need another one? Hit Next Block.',
  'Join or leave whenever. There are no turns and no sign-ups.',
]

export function HowToPlayModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="How to play" onClose={onClose}>
      <ol className="space-y-3">
        {STEPS.map((step, index) => (
          <li key={step} className="flex gap-4 text-lg">
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-hot/15 font-display text-sm font-bold text-hot"
            >
              {index + 1}
            </span>
            <span className="pt-0.5">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-6 rounded-2xl border border-tangerine/30 bg-tangerine/10 p-4 text-tangerine">
        Commit to the bit. Not to something you&apos;re uncomfortable with. Pass whenever. No explanations. Don&apos;t be
        weird.
      </p>
      <p className="mt-3 text-sm text-mist">
        Nothing here ever requires drinking, touching anyone, sharing private messages or photos, spilling someone
        else&apos;s secrets, or doing anything unsafe.
      </p>
      <p className="mt-5 text-center text-sm">
        <Link to="/admin" className="text-mist underline underline-offset-4 hover:text-paper">
          Host? Manage cards
        </Link>
      </p>
    </Modal>
  )
}
