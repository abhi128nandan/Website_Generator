import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import TooltipPage from './pages/TooltipPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TooltipPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
