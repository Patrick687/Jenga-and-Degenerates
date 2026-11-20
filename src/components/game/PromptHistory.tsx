import { Flame, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { CATEGORIES, CATEGORY_META } from '../../features/game/data/categories'
import type { HistoryEntry } from '../../features/game/types/game.types'
import { countByCategory, countPassed, formatRelativeTime } from '../../features/game/utils/promptHelpers'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { CATEGORY_THEME } from './categoryTheme'

/** Only ask "are you sure?" once there is a meaningful amount of history to lose. */
const CONFIRM_RESET_THRESHOLD = 5

interface PromptHistoryProps {
  history: readonly HistoryEntry[]
  onReset: () => void
  onClose: () => void
}

export function PromptHistory({ history, onReset, onClose }: PromptHistoryProps) {
  const [confirmingReset, setConfirmingReset] = useState(false)
  const counts = countByCategory(history)
  const passed = countPassed(history)
  // Snapshot taken when the sheet opens; the sheet is remounted each time it is opened.
  const [now] = useState(() => Date.now())

  const requestReset = () => {
    if (history.length > CONFIRM_RESET_THRESHOLD) {
      setConfirmingReset(true)
    } else {
      onReset()
      onClose()
    }
  }

  return (
    <Modal title="Pull history" onClose={onClose}>
      <p className="mb-4 text-sm text-mist">
        <span className="font-semibold text-paper">{history.length} pulled</span>
        {CATEGORIES.map((category) => ` · ${counts[category]} ${CATEGORY_META[category].label.toLowerCase()}`)}
        {passed > 0 && ` · ${passed} passed`}
      </p>

      {history.length === 0 ? (
        <p className="rounded-2xl border border-white/10 bg-ink/50 p-6 text-center text-mist">
          Nothing yet. Go pull a block.
        </p>
      ) : (
        <ol className="space-y-3">
          {history.map((entry) => {
            const theme = CATEGORY_THEME[entry.category]
            return (
              <li key={entry.id} className="rounded-2xl border border-white/10 bg-ink/50 p-4">
                <div className="mb-2 flex items-center gap-2 text-xs font-bold tracking-[0.14em] uppercase">
                  <span className={`inline-flex items-center gap-1.5 ${theme.text}`}>
                    <theme.Icon aria-hidden className="size-3.5" />
                    {CATEGORY_META[entry.category].label}
                  </span>
                  {entry.spicy && (
                    <span className="inline-flex items-center gap-1 text-hot">
                      <Flame aria-hidden className="size-3.5" />
                      Spicy
                    </span>
                  )}
                  {entry.passed && <span className="text-mist">Passed</span>}
                  <span className="ml-auto font-medium tracking-normal text-mist normal-case">
                    {formatRelativeTime(entry.timestamp, now)}
                  </span>
                </div>
                <p className={`text-base leading-snug ${entry.passed ? 'text-mist' : ''}`}>{entry.text}</p>
              </li>
            )
          })}
        </ol>
      )}

      <div className="mt-6 border-t border-white/10 pt-5">
        {confirmingReset ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-mist">
              This wipes your history and shuffles every prompt back into the pile. Only on this phone.
            </p>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={() => setConfirmingReset(false)}>
                Keep it
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => {
                  onReset()
                  onClose()
                }}
              >
                Yes, reset
              </Button>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            className="w-full"
            onClick={requestReset}
            disabled={history.length === 0}
            icon={<RotateCcw aria-hidden className="size-4" />}
          >
            Reset game
          </Button>
        )}
      </div>
    </Modal>
  )
}
