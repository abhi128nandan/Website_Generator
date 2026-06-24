import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CalculatorPage from './pages/CalculatorPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CalculatorPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
