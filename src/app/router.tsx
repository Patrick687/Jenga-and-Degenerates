import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { GamePage } from '../pages/GamePage'

// Guests only ever download the game; the card manager loads on demand.
const AssassinPage = lazy(() => import('../pages/AssassinPage').then((module) => ({ default: module.AssassinPage })))
const AssassinHostPage = lazy(() =>
  import('../pages/AssassinHostPage').then((module) => ({ default: module.AssassinHostPage })),
)
const AdminPage = lazy(() => import('../pages/AdminPage').then((module) => ({ default: module.AdminPage })))

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<GamePage />} />
      <Route
        path="/admin"
        element={
          <Suspense fallback={null}>
            <AdminPage />
          </Suspense>
        }
      />
      <Route
        path="/assassin"
        element={
          <Suspense fallback={null}>
            <AssassinPage />
          </Suspense>
        }
      />
      <Route
        path="/assassin/host"
        element={
          <Suspense fallback={null}>
            <AssassinHostPage />
          </Suspense>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
