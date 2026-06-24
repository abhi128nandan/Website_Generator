import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import CounterPage from './pages/CounterPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CounterPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
