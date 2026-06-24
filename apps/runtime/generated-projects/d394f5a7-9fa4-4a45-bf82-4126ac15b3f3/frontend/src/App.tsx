import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
