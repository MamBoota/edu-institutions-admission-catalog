import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function GuestOnly({ children }) {
  const { me, loading } = useAuth()
  if (loading) return <p className="muted">Загрузка…</p>
  if (me) return <Navigate to="/" replace />
  return children
}
