import React from 'react'

function TestApp() {
  console.log('=== TEST APP RENDERED ===')
  console.log('This should definitely appear in console')
  
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1>Test App</h1>
      <p>If you can see this, React is working</p>
      <p>Check the console for debug messages</p>
      <button onClick={() => console.log('Button clicked!')}>
        Click me to test console
      </button>
    </div>
  )
}

export default TestApp