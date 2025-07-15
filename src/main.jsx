import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './hooks/useAuth.jsx'

console.log('=== MAIN.JSX LOADED ===')
console.log('React:', React)
console.log('ReactDOM:', ReactDOM)
console.log('App:', App)
console.log('AuthProvider:', AuthProvider)

const rootElement = document.getElementById('root')
console.log('Root element:', rootElement)

if (rootElement) {
  console.log('Creating React root...')
  const root = ReactDOM.createRoot(rootElement)
  console.log('Root created:', root)
  
  console.log('Rendering app...')
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>
  )
  console.log('App rendered')
} else {
  console.error('Root element not found!')
}