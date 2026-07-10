'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface AuthUser {
  id: number
  email: string
  first_name?: string | null
  last_name?: string | null
  google_id?: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: AuthUser | null
  token: string | null
  loading: boolean
  error: string | null
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: (googleId: string, email: string, firstName?: string, lastName?: string) => Promise<void>
  logOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load session from cookie or localStorage on mount
  useEffect(() => {
    const loadSession = async () => {
      // Try to get token from cookie first (set by OAuth callback)
      const cookieToken = getCookie('auth_token_client')
      // Fallback to localStorage for backward compatibility
      const storedToken = cookieToken || localStorage.getItem('auth_token')
      
      if (storedToken) {
        // Set token first so it's available immediately
        setToken(storedToken)
        // Store in localStorage if it came from cookie
        if (cookieToken) {
          localStorage.setItem('auth_token', storedToken)
        }
        // Verify token is still valid
        await verifyToken(storedToken)
      } else {
        setLoading(false)
      }
    }
    
    loadSession()
  }, [])

  // Helper function to get cookie value
  const getCookie = (name: string): string | null => {
    if (typeof document === 'undefined') return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null
    return null
  }

  const verifyToken = async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('auth_token')
        setToken(null)
        setUser(null)
      }
    } catch (err) {
      console.error('[v0] Token verification failed:', err)
      localStorage.removeItem('auth_token')
      setToken(null)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'فشل إنشاء الحساب'
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      // Auto-login after signup
      await logIn(email, password)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل إنشاء الحساب'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logIn = async (email: string, password: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'فشل تسجيل الدخول'
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('auth_token', data.token)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل تسجيل الدخول'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signInWithGoogle = async (googleId: string, email: string, firstName?: string, lastName?: string) => {
    try {
      setError(null)
      setLoading(true)

      const response = await fetch('/api/auth/google/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId,
          email,
          firstName,
          lastName,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        const errorMsg = data.error || 'فشل تسجيل الدخول عبر Google'
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      const data = await response.json()
      setToken(data.token)
      setUser(data.user)
      localStorage.setItem('auth_token', data.token)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'فشل تسجيل الدخول عبر Google'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logOut = async () => {
    try {
      setError(null)
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
      }
    } catch (err) {
      console.error('[v0] Logout error:', err)
    } finally {
      setToken(null)
      setUser(null)
      localStorage.removeItem('auth_token')
    }
  }

  const clearError = () => setError(null)

  return (
    <AuthContext.Provider value={{ user, token, loading, error, signUp, logIn, signInWithGoogle, logOut, clearError }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
