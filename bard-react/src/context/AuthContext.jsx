import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { auth as authApi, clearCsrf } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = guest
  const [loading, setLoading] = useState(true)

  // Hydrate from server on mount
  useEffect(() => {
    authApi.me()
      .then(res => setUser(res?.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // identifier can be email or username
  const login = useCallback(async (identifier, password) => {
    const res = await authApi.login({ identifier, password })
    setUser(res?.data?.user ?? null)
    return res
  }, [])

  const register = useCallback(async (displayName, username, email, password) => {
    const res = await authApi.register({ displayName, username, email, password })
    setUser(res?.data?.user ?? null)
    return res
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    clearCsrf()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res?.data?.user ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
