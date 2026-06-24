import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ModalPage from './pages/ModalPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ModalPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
