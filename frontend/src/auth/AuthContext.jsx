import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, getToken, setToken } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setMe(null)
      setLoading(false)
      return
    }
    try {
      const data = await apiFetch('/api/me')
      setMe(data)
    } catch {
      setToken(null)
      setMe(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(
    async (email, password) => {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        json: { email, password },
      })
      if (!data?.access_token) {
        throw new Error('Сервер не вернул токен — проверьте API (/api/auth/login).')
      }
      setToken(data.access_token)
      await refresh()
    },
    [refresh],
  )

  const register = useCallback(
    async (payload) => {
      const data = await apiFetch('/api/auth/register', {
        method: 'POST',
        json: payload,
      })
      if (!data?.access_token) {
        throw new Error('Сервер не вернул токен — проверьте API (/api/auth/register).')
      }
      setToken(data.access_token)
      await refresh()
    },
    [refresh],
  )

  const logout = useCallback(() => {
    setToken(null)
    setMe(null)
  }, [])

  const value = useMemo(
    () => ({
      me,
      loading,
      login,
      register,
      logout,
      refresh,
      isAdmin: me?.user?.role === 'admin',
    }),
    [me, loading, login, register, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
