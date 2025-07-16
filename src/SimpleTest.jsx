import React from 'react'

function SimpleTest() {
  return (
    <div style={{ padding: '20px', fontSize: '18px' }}>
      <h1>SIMPLE TEST - CODE UPDATED</h1>
      <p>If you see this, the deployment is working</p>
      <p>Current time: {new Date().toISOString()}</p>
      <div style={{ backgroundColor: 'yellow', padding: '10px', margin: '10px 0' }}>
        THIS IS A BRIGHT YELLOW BOX TO CONFIRM CODE CHANGES
      </div>
    </div>
  )
}

export default SimpleTest