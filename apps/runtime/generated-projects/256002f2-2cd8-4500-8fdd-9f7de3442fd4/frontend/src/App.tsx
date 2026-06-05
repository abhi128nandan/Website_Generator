import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/" 
          element={
            <div>
              <h1>Calculator</h1>
              <p>Basic calculator functionality will be implemented here</p>
            </div>
          } 
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App