import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { auth } from '../api/supabaseClient'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Handle auth callback and clear URL fragments
      if (event === 'SIGNED_IN' && window.location.hash) {
        window.history.replaceState({}, document.title, window.location.pathname)
      }
      handleAuthChange(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthChange = async (authUser) => {
    // Store auth debug info
    if (typeof window !== 'undefined') {
      window.DEBUG_AUTH_CHANGE = {
        authUser: authUser ? { id: authUser.id, email: authUser.email } : null,
        timestamp: new Date().toISOString()
      }
    }
    
    if (authUser) {
      // Create user profile if it doesn't exist
      try {
        await auth.createUserProfile(authUser)
      } catch (error) {
        if (typeof window !== 'undefined') {
          window.DEBUG_AUTH_ERROR = {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      }
    }
    setUser(authUser)
    setLoading(false)
  }

  const signInWithMagicLink = async (email) => {
    // Force redirect to current domain (Netlify)
    const redirectUrl = window.location.origin
    console.log('Magic link redirect URL:', redirectUrl)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl
      }
    })
    console.log('Magic link result:', { error })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    loading,
    signInWithMagicLink,
    signOut,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}