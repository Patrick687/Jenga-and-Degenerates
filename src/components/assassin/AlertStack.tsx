import { Bell, Skull, Timer, X } from 'lucide-react'
import { useEffect } from 'react'
import type { PartyAlert } from '../../features/assassin/utils/alerts'

interface AlertStackProps {
  alerts: readonly PartyAlert[]
  onDismiss: (id: string) => void
}

const TONE_STYLES = {
  danger: { box: 'border-red-400/60 bg-red-950/90', Icon: Skull, icon: 'text-red-300' },
  ready: { box: 'border-tangerine/60 bg-plum', Icon: Timer, icon: 'text-tangerine' },
  info: { box: 'border-white/15 bg-plum', Icon: Bell, icon: 'text-grape' },
} as const

function AlertCard({ alert, onDismiss }: { alert: PartyAlert; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = window.setTimeout(() => onDismiss(alert.id), alert.tone === 'danger' ? 12000 : 7000)
    return () => window.clearTimeout(timer)
  }, [alert, onDismiss])

  const { box, Icon, icon } = TONE_STYLES[alert.tone]
  return (
    <div
      role="status"
      className={`pointer-events-auto flex animate-sheet-in items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur ${box}`}
    >
      <Icon aria-hidden className={`mt-0.5 size-5 shrink-0 ${icon}`} />
      <div className="min-w-0 flex-1">
        <p className="font-display font-bold">{alert.title}</p>
        <p className="text-sm text-mist">{alert.message}</p>
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => onDismiss(alert.id)}
        className="rounded-full p-1 text-mist hover:text-paper"
      >
        <X aria-hidden className="size-4" />
      </button>
    </div>
  )
}

/** Banners that slide in when something happens. They clear themselves after a few seconds. */
export function AlertStack({ alerts, onDismiss }: AlertStackProps) {
  if (alerts.length === 0) return null
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 mx-auto flex max-w-xl flex-col gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
