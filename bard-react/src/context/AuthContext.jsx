import { useState, useEffect, useCallback } from 'react'
import { auth as authApi, clearCsrf } from '../api'
import { AuthContext } from './authState'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = loading, null = guest
  const [loading, setLoading] = useState(true)
  const [registrationCompleted, setRegistrationCompleted] = useState(false)

  // Hydrate from server on mount
  useEffect(() => {
    authApi.me()
      .then(res => setUser(res?.data?.user ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // identifier can be email or username
  const login = useCallback(async (identifier, password) => {
    const response = await authApi.login({ identifier, password })
    setUser(response?.data?.user ?? null)
    setRegistrationCompleted(false)
    return response
  }, [])

  const register = useCallback(async (displayName, username, email, password) => {
    const response = await authApi.register({ displayName, username, email, password })
    setUser(response?.data?.user ?? null)
    setRegistrationCompleted(true)
    // Keep status fields such as verificationEmailSent available to the caller.
    return response
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout()
    clearCsrf()
    setUser(null)
    setRegistrationCompleted(false)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res?.data?.user ?? null)
    } catch {
      setUser(null)
    }
  }, [])

  const clearRegistrationCompleted = useCallback(() => setRegistrationCompleted(false), [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUser, registrationCompleted, clearRegistrationCompleted }}>
      {children}
    </AuthContext.Provider>
  )
}
