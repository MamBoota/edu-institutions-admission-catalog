import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function AdminOnly({ children }) {
  const { me, loading, isAdmin } = useAuth()
  if (loading) return <p className="muted">Загрузка…</p>
  if (!me) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}
