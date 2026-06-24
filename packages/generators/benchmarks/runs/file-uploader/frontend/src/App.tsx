import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import FileUploadPage from './pages/FileUploadPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FileUploadPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
