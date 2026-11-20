import { AdminLogin } from '../components/admin/AdminLogin'
import { HostConsole } from '../components/assassin/HostConsole'
import { AppShell } from '../components/layout/AppShell'
import { useAdminSession } from '../features/cards/hooks/useAdminSession'

export function AssassinHostPage() {
  const { session, login, logout } = useAdminSession()

  return (
    <AppShell>
      {session.status === 'authenticated' ? (
        <HostConsole password={session.password} onLogout={logout} />
      ) : session.status === 'checking' ? (
        <p className="flex flex-1 items-center justify-center text-mist">Checking…</p>
      ) : (
        <AdminLogin
          onLogin={login}
          heading={['Assassin', 'host']}
          description="Hosts only. Enter the admin password to run the game."
        />
      )}
    </AppShell>
  )
}
