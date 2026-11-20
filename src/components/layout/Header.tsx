import { CircleHelp, History, PartyPopper, QrCode } from 'lucide-react'
import { IconButton } from '../ui/IconButton'

interface HeaderProps {
  historyCount: number
  onOpenHistory: () => void
  onOpenQr: () => void
  onOpenHelp: () => void
}

export function Header({ historyCount, onOpenHistory, onOpenQr, onOpenHelp }: HeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
      <span className="inline-flex items-center gap-1.5 rounded-full border border-hot/40 bg-hot/10 px-3 py-1.5 text-[11px] font-bold tracking-[0.12em] whitespace-nowrap text-hot uppercase">
        <PartyPopper aria-hidden className="size-4" />
        Birthday Edition
      </span>
      <nav aria-label="Menu" className="flex items-center gap-2">
        <IconButton label="How to play" onClick={onOpenHelp}>
          <CircleHelp aria-hidden className="size-5" />
        </IconButton>
        <IconButton label="Show QR code" onClick={onOpenQr}>
          <QrCode aria-hidden className="size-5" />
        </IconButton>
        <IconButton label={`History, ${historyCount} prompts`} onClick={onOpenHistory}>
          <History aria-hidden className="size-5" />
          {historyCount > 0 && (
            <span
              aria-hidden
              className="absolute -top-1 -right-1 min-w-5 rounded-full bg-hot px-1 text-center text-[11px] leading-5 font-bold text-ink"
            >
              {historyCount}
            </span>
          )}
        </IconButton>
      </nav>
    </header>
  )
}
