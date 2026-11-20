import { Flame } from 'lucide-react'

interface SpicyModeToggleProps {
  enabled: boolean
  onChange: (enabled: boolean) => void
}

export function SpicyModeToggle({ enabled, onChange }: SpicyModeToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition active:scale-[0.99] ${
        enabled ? 'border-hot/60 bg-hot/10' : 'border-white/10 bg-plum hover:bg-white/10'
      }`}
    >
      <Flame aria-hidden className={`size-7 shrink-0 ${enabled ? 'text-hot' : 'text-mist'}`} />
      <span className="flex-1">
        <span className="block font-display text-lg font-bold">Turn up the heat</span>
        <span className="block text-sm text-mist">
          {enabled ? 'Spicy prompts are on. Tap to cool it down.' : 'Adds the flirty, suggestive stuff.'}
        </span>
      </span>
      <span
        aria-hidden
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${enabled ? 'bg-hot' : 'bg-white/15'}`}
      >
        <span
          className={`absolute top-1 left-1 size-6 rounded-full bg-paper shadow transition-transform ${enabled ? 'translate-x-6' : ''}`}
        />
      </span>
    </button>
  )
}
