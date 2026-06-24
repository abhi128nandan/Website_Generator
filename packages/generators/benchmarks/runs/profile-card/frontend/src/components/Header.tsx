import { Search, Home, Menu, Settings, Sun, Moon } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  onMenuToggle?: () => void
  isDarkMode?: boolean
  onThemeToggle?: () => void
}

export default function Header({ onMenuToggle, isDarkMode = false, onThemeToggle }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-gray-800 text-white shadow-lg backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md hover:bg-gray-800 transition-colors duration-200"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="hidden md:flex items-center space-x-6">
            <button className="p-2 rounded-md hover:bg-gray-800 transition-colors duration-200">
              <Home className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-md hover:bg-gray-800 transition-colors duration-200">
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onThemeToggle}
              className="p-2 rounded-md hover:bg-gray-800 transition-colors duration-200"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        <div className="relative flex-1 max-w-lg mx-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full py-2 pl-10 pr-4 bg-gray-800 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-gray-700"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200">
            <Sun className="w-5 h-5" />
          </button>
          <button className="p-2 rounded-full hover:bg-gray-800 transition-colors duration-200">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-gray-900 text-white overflow-hidden transition-all duration-300 ease-in-out shadow-lg`}>
        <div className="px-4 py-3 space-y-3">
          <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200">
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>
          <button className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
          <button
            onClick={onThemeToggle}
            className="flex items-center space-x-3 w-full p-3 rounded-lg hover:bg-gray-800 transition-colors duration-200"
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            <span>Toggle Theme</span>
          </button>
        </div>
      </div>
    </header>
  )
}