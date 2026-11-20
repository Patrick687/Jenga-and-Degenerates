import { AdminLogin } from '../components/admin/AdminLogin'
import { CardManager } from '../components/admin/CardManager'
import { AppShell } from '../components/layout/AppShell'
import { useAdminSession } from '../features/cards/hooks/useAdminSession'

export function AdminPage() {
  const { session, login, logout } = useAdminSession()

  return (
    <AppShell>
      {session.status === 'authenticated' ? (
        <CardManager password={session.password} onLogout={logout} />
      ) : session.status === 'checking' ? (
        <p className="flex flex-1 items-center justify-center text-mist">Checking…</p>
      ) : (
        <AdminLogin onLogin={login} />
      )}
    </AppShell>
  )
}
