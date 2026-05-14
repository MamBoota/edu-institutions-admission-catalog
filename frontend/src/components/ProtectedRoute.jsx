import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function ProtectedRoute() {
  const { me, loading } = useAuth()
  const loc = useLocation()

  if (loading) {
    return <p className="muted">Загрузка…</p>
  }

  if (!me) {
    return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  }

  return <Outlet />
}
