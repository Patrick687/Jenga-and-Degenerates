import { ScrollText, Skull, Users, Vote, type LucideIcon } from 'lucide-react'

export type TabId = 'me' | 'players' | 'vote' | 'feed'

const TABS: ReadonlyArray<{ id: TabId; label: string; Icon: LucideIcon }> = [
  { id: 'me', label: 'You', Icon: Skull },
  { id: 'players', label: 'Players', Icon: Users },
  { id: 'vote', label: 'Vote', Icon: Vote },
  { id: 'feed', label: 'Feed', Icon: ScrollText },
]

interface TabBarProps {
  active: TabId
  onChange: (tab: TabId) => void
  /** Tabs that should show a dot because something needs attention. */
  badges: Partial<Record<TabId, boolean>>
}

export function TabBar({ active, onChange, badges }: TabBarProps) {
  return (
    <nav
      aria-label="Sections"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div className="mx-auto grid max-w-xl grid-cols-4">
        {TABS.map(({ id, label, Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(id)}
              className={`relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold transition ${
                isActive ? 'text-hot' : 'text-mist hover:text-paper'
              }`}
            >
              <span className="relative">
                <Icon aria-hidden className="size-6" />
                {badges[id] && (
                  <span className="absolute -top-1 -right-1.5 size-2.5 animate-pulse-ring rounded-full bg-hot" />
                )}
              </span>
              {label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
