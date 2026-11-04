import { useCallback, useEffect, useMemo, useState } from 'react'
import { AUTH_STORAGE_KEY, authApi } from '../services/api'
import { AuthContext } from './useAuth'

const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1]
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    )

    return JSON.parse(atob(padded))
  } catch {
    return null
  }
}

const isTokenValid = (token) => {
  const payload = decodeToken(token)

  if (!payload || !payload.exp) {
    return false
  }

  return payload.exp * 1000 > Date.now()
}

const readStoredAuth = () => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY)

    if (!stored) {
      return null
    }

    const parsed = JSON.parse(stored)

    if (!parsed?.token || !parsed?.user || !isTokenValid(parsed.token)) {
      localStorage.removeItem(AUTH_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth)
  const [authError, setAuthError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const handleUnauthorized = () => {
      setAuth(null)
    }

    window.addEventListener('pulsepoll:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('pulsepoll:unauthorized', handleUnauthorized)
    }
  }, [])

  const persistAuth = useCallback((nextAuth) => {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuth))
    setAuth(nextAuth)
    setAuthError('')
  }, [])

  const login = useCallback(
    async (credentials) => {
      setIsSubmitting(true)
      setAuthError('')

      try {
        const result = await authApi.login(credentials)
        persistAuth(result.data)
        return result.data
      } catch (error) {
        const message = error?.response?.data?.message || 'Unable to log in'
        setAuthError(message)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [persistAuth],
  )

  const register = useCallback(
    async (details) => {
      setIsSubmitting(true)
      setAuthError('')

      try {
        const result = await authApi.register(details)
        persistAuth(result.data)
        return result.data
      } catch (error) {
        const message =
          error?.response?.data?.message || 'Unable to register'
        setAuthError(message)
        throw error
      } finally {
        setIsSubmitting(false)
      }
    },
    [persistAuth],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY)
    setAuth(null)
    setAuthError('')
  }, [])

  const clearAuthError = useCallback(() => setAuthError(''), [])

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.token),
      authError,
      isSubmitting,
      login,
      register,
      logout,
      clearAuthError,
    }),
    [
      auth,
      authError,
      isSubmitting,
      login,
      register,
      logout,
      clearAuthError,
    ],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
