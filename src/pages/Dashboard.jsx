import React from 'react'
import { useAuth } from '../hooks/useAuth'

export default function Dashboard() {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

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
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}