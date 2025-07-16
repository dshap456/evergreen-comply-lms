import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import MagicLinkLogin from './components/auth/MagicLinkLogin'
import Dashboard from './pages/Dashboard'

function App() {
  // Force debug output that won't be optimized away
  if (typeof window !== 'undefined') {
    window.DEBUG_APP_STATE = {
      rendered: new Date().toISOString(),
      windowExists: typeof window !== 'undefined',
      documentExists: typeof document !== 'undefined'
    }
  }
  
  // Add error boundary around useAuth
  let authResult
  try {
    authResult = useAuth()
    console.log('useAuth successful:', authResult)
  } catch (error) {
    console.error('useAuth error:', error)
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Auth Error</h1>
          <p className="text-red-700">{error.message}</p>
        </div>
      </div>
    )
  }
  
  const { user, loading } = authResult
  
  // Store debug info in window object
  if (typeof window !== 'undefined') {
    window.DEBUG_AUTH_STATE = {
      user: user ? { id: user.id, email: user.email } : null,
      loading,
      timestamp: new Date().toISOString()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    if (typeof window !== 'undefined') {
      window.DEBUG_FLOW = 'showing_login'
    }
    return <MagicLinkLogin />
  }

  if (typeof window !== 'undefined') {
    window.DEBUG_FLOW = 'showing_dashboard'
  }
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App