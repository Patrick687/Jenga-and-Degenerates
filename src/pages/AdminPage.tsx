import { ArrowLeft, LogOut } from 'lucide-react'
import { Link, useSearchParams } from 'react-router'
import { AdminLogin } from '../components/admin/AdminLogin'
import { CardManager } from '../components/admin/CardManager'
import { SubmissionsManager } from '../components/admin/SubmissionsManager'
import { HostConsole } from '../components/assassin/HostConsole'
import { AppShell } from '../components/layout/AppShell'
import { IconButton } from '../components/ui/IconButton'
import { useAdminSession } from '../features/cards/hooks/useAdminSession'
import { useSubmissions } from '../features/submissions/hooks/useSubmissions'

type Section = 'cards' | 'suggestions' | 'assassin'

const SECTIONS: ReadonlyArray<{ id: Section; label: string }> = [
  { id: 'cards', label: 'Jenga cards' },
  { id: 'suggestions', label: 'Suggestions' },
  { id: 'assassin', label: 'Assassin' },
]

interface AdminHomeProps {
  password: string
  onLogout: () => void
}

/** One host area for both games. `?tab=assassin` opens the Assassin tools directly. */
function AdminHome({ password, onLogout }: AdminHomeProps) {
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab')
  const section: Section = tab === 'assassin' || tab === 'suggestions' ? tab : 'cards'
  const { submissions, error: submissionsError, refresh: refreshSubmissions } = useSubmissions(password, onLogout)
  const waiting = submissions?.length ?? 0

  return (
    <>
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/10 bg-plum px-4 text-sm font-semibold hover:bg-white/10"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Game
        </Link>
        <IconButton label="Log out" onClick={onLogout}>
          <LogOut aria-hidden className="size-5" />
        </IconButton>
      </header>

      <div role="group" aria-label="Section" className="mx-5 mt-2 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-plum p-1.5">
        {SECTIONS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            aria-pressed={section === id}
            onClick={() => setParams(id === 'cards' ? {} : { tab: id }, { replace: true })}
            className={`relative min-h-11 rounded-xl font-display text-sm font-bold transition active:scale-95 ${
              section === id ? 'bg-hot text-ink' : 'text-mist hover:bg-white/10 hover:text-paper'
            }`}
          >
            {label}
            {id === 'suggestions' && waiting > 0 && (
              <span
                aria-label={`${waiting} waiting`}
                className="absolute -top-1.5 -right-1 inline-flex min-w-5 items-center justify-center rounded-full bg-tangerine px-1.5 text-xs font-bold text-ink"
              >
                {waiting}
              </span>
            )}
          </button>
        ))}
      </div>

      {section === 'cards' ? (
        <CardManager password={password} onLogout={onLogout} />
      ) : section === 'suggestions' ? (
        <SubmissionsManager
          password={password}
          onLogout={onLogout}
          submissions={submissions}
          error={submissionsError}
          refresh={refreshSubmissions}
        />
      ) : (
        <HostConsole password={password} onLogout={onLogout} />
      )}
    </>
  )
}

export function AdminPage() {
  const { session, login, logout } = useAdminSession()

  return (
    <AppShell>
      {session.status === 'authenticated' ? (
        <AdminHome password={session.password} onLogout={logout} />
      ) : session.status === 'checking' ? (
        <p className="flex flex-1 items-center justify-center text-mist">Checking…</p>
      ) : (
        <AdminLogin
          onLogin={login}
          heading={['Host', 'tools']}
          description="Hosts only. Enter the admin password to manage the Jenga cards, review suggestions and run the Assassin game."
        />
      )}
    </AppShell>
  )
}
