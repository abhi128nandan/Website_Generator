import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home, Database, Activity, Settings, Menu } from 'lucide-react'
import TaskDashboard from './pages/TaskDashboard'
import TaskForm from './pages/TaskForm'
import TaskEditForm from './pages/TaskEditForm'
import CategoryManagement from './pages/CategoryManagement'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Activity className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="font-bold text-lg tracking-tight">TaskMaster</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              <li>
                <Link to="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Database className="w-4 h-4 mr-3 text-gray-400" />
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/tasks/create" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Database className="w-4 h-4 mr-3 text-gray-400" />
                  Create Task
                </Link>
              </li>
              <li>
                <Link to="/categories" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-100 text-gray-700">
                  <Database className="w-4 h-4 mr-3 text-gray-400" />
                  Categories
                </Link>
              </li>
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
            <div className="flex items-center">
              <button className="text-gray-500 hover:text-gray-700 focus:outline-none lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">Live</span>
            </div>
          </header>
          
          <div className="flex-1 overflow-y-auto p-8">
            <Routes>
              <Route path="/dashboard" element={<TaskDashboard />} />
              <Route path="/tasks/create" element={<TaskForm />} />
              <Route path="/tasks/:id/edit" element={<TaskEditForm />} />
              <Route path="/categories" element={<CategoryManagement />} />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
