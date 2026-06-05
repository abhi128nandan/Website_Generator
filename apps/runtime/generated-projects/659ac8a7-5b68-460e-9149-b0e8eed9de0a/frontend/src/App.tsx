import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import TaskDetailsPage from './pages/TaskDetailsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/task/:id" element={<TaskDetailsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
