import { Home, Settings, Star, Heart, Eye, Trash2, Edit, Check, Menu, Moon, Sun } from 'lucide-react'
import { useState } from 'react'

interface SidebarProps {
  onToggle?: (open: boolean) => void
  onNavigate?: (section: string) => void
  isDarkMode?: boolean
  onToggleDarkMode?: () => void
}

export default function Sidebar({ onToggle, onNavigate, isDarkMode = false, onToggleDarkMode }: SidebarProps) {
  const [open, setOpen] = useState(true)
  const [active, setActive] = useState('home')

  const toggle = () => {
    setOpen(!open)
    onToggle?.(!open)
  }

  const handleNavigate = (section: string) => {
    setActive(section)
    onNavigate?.(section)
  }

  return (
    <div className={`transition-all duration-300 ease-in-out h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white border-r border-gray-700 flex flex-col ${open ? 'w-64' : 'w-16'}`}>
      <div className="flex items-center justify-between p-4">
        <div className={`font-bold text-xl transition-all ${open ? 'opacity-100' : 'opacity-0'}`}>CRUD</div>
        <button
          onClick={toggle}
          className="p-1 rounded-lg hover:bg-gray-700 focus:outline-none focus:bg-gray-700"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <nav className="mt-6">
          {[
            { id: 'home', label: 'Home', icon: <Home /> },
            { id: 'settings', label: 'Settings', icon: <Settings /> },
            { id: 'star', label: 'Starred', icon: <Star /> },
            { id: 'heart', label: 'Favorites', icon: <Heart /> },
            { id: 'edit', label: 'Edit', icon: <Edit /> },
            { id: 'eye', label: 'View', icon: <Eye /> },
            { id: 'trash', label: 'Delete', icon: <Trash2 /> },
            { id: 'check', label: 'Confirm', icon: <Check /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={`flex items-center w-full px-4 py-3 text-left transition-colors duration-200 rounded-lg ${
                active === item.id
                  ? 'bg-purple-600 text-white'
                  : 'hover:bg-gray-700'
              }`}
            >
              <div className="mr-3">{item.icon}</div>
              <span className={`${!open ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-700">
        <button
          onClick={onToggleDarkMode}
          className="w-full flex items-center justify-center px-4 py-3 rounded-lg hover:bg-gray-700 transition-colors duration-200"
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          <span className={`ml-3 ${!open ? 'opacity-0' : 'opacity-100'}`}>
            {isDarkMode ? 'Light Mode' : 'Dark Mode'}
          </span>
        </button>
      </div>
    </div>
  )
}