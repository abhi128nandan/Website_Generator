import React from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { Home, Database, Activity, Settings, Menu } from 'lucide-react'

function App() {
  return (
    <BrowserRouter>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
          <div className="h-16 flex items-center px-6 border-b border-gray-200">
            <Activity className="w-6 h-6 text-indigo-600 mr-2" />
            <span className="font-bold text-lg tracking-tight">To-Do App</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
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
              <Route path="/" element={
                <div className="max-w-4xl mx-auto">
                  <h1 className="text-3xl font-bold text-gray-900 mb-6">Welcome to To-Do App</h1>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">System Overview</h2>
                    <p className="text-gray-600 mb-6">crud-admin</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <h3 className="font-medium text-gray-900 mb-2">Enabled Workflows</h3>
                        <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                          <li>task management</li>
                          <li>activity organization</li>
                          <li>pending and completed task tracking</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              } />
            </Routes>
          </div>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
