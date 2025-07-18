import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { auth } from '../api/supabaseClient'
import AdminDashboard from './AdminDashboard'
import LearnerDashboard from './LearnerDashboard'

export default function Dashboard() {
  // Store dashboard debug info
  if (typeof window !== 'undefined') {
    window.DEBUG_DASHBOARD = {
      rendered: new Date().toISOString(),
      step: 'dashboard_start'
    }
  }
  
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Store auth hook result
  if (typeof window !== 'undefined') {
    window.DEBUG_DASHBOARD_AUTH = {
      user: user ? { id: user.id, email: user.email } : null,
      hasSignOut: !!signOut,
      timestamp: new Date().toISOString()
    }
  }

  useEffect(() => {
    console.log('Dashboard useEffect triggered, user:', user)
    loadUserProfile()
  }, [user])

  const loadUserProfile = async () => {
    // Store profile loading debug info
    if (typeof window !== 'undefined') {
      window.DEBUG_PROFILE_LOADING = {
        user: user ? { id: user.id, email: user.email } : null,
        step: 'loading_start',
        timestamp: new Date().toISOString()
      }
    }
    
    try {
      if (user) {
        const profile = await auth.getCurrentUser()
        
        // Store profile result
        if (typeof window !== 'undefined') {
          window.DEBUG_PROFILE_RESULT = {
            profile: profile,
            timestamp: new Date().toISOString()
          }
        }
        
        setUserProfile(profile)
      } else {
        if (typeof window !== 'undefined') {
          window.DEBUG_PROFILE_LOADING.step = 'no_user_found'
        }
      }
    } catch (error) {
      if (typeof window !== 'undefined') {
        window.DEBUG_PROFILE_ERROR = {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
    setLoading(false)
  }

  const handleSignOut = async () => {
    await signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // TEMPORARY: Skip profile loading and go straight to admin dashboard for testing
  if (user && user.email === 'support@evergreencomply.com') {
    const tempProfile = {
      id: user.id,
      email: user.email,
      full_name: 'EverGreen Comply Admin',
      role: 'super_admin'
    }
    return <AdminDashboard user={tempProfile} onSignOut={handleSignOut} />
  }
  
  // Show migration success for first-time users without profile
  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <header className="bg-white shadow-sm border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <h1 className="text-xl font-semibold text-slate-900">EverGreen Comply Dashboard</h1>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-slate-600">Welcome, {user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-slate-600 hover:text-slate-900 px-3 py-2 rounded-md border border-slate-300 hover:border-slate-400"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">✅ Migration Success!</h2>
              <p className="text-lg text-slate-600 mb-6">
                EverGreen Comply has been successfully migrated from Base44 to Supabase
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-2">Authentication</h3>
                  <p className="text-sm text-blue-700">Magic Links with Supabase Auth</p>
                </div>
                <div className="bg-green-50 rounded-lg p-6">
                  <h3 className="font-semibold text-green-900 mb-2">Database</h3>
                  <p className="text-sm text-green-700">PostgreSQL with Row Level Security</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-6">
                  <h3 className="font-semibold text-purple-900 mb-2">Storage</h3>
                  <p className="text-sm text-purple-700">Supabase Storage for file uploads</p>
                </div>
              </div>

              <div className="mt-8 text-sm text-slate-500">
                <p>Environment: {import.meta.env.VITE_SUPABASE_URL ? 'Connected to Supabase' : 'Missing configuration'}</p>
                <p>User ID: {user?.id}</p>
                <p>User Email: {user?.email}</p>
                <p>Loading State: {loading ? 'true' : 'false'}</p>
                <p>User Profile: {userProfile ? JSON.stringify(userProfile) : 'null'}</p>
              </div>

              <div className="mt-8">
                <button
                  onClick={() => {
                    // Force admin dashboard for support email
                    if (user?.email === 'support@evergreencomply.com') {
                      const tempProfile = {
                        id: user.id,
                        email: user.email,
                        full_name: 'EverGreen Comply Admin',
                        role: 'super_admin'
                      }
                      setUserProfile(tempProfile)
                    } else {
                      loadUserProfile()
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Route to appropriate dashboard based on role
  if (userProfile.role === 'super_admin') {
    return <AdminDashboard user={userProfile} onSignOut={handleSignOut} />
  }

  // Default to learner dashboard
  return <LearnerDashboard user={userProfile} onSignOut={handleSignOut} />
}