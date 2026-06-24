import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import TaskDetailPage from './pages/TaskDetailPage'
import AuthPage from './pages/AuthPage'
import CategoryPage from './pages/CategoryPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/categories" element={<CategoryPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
