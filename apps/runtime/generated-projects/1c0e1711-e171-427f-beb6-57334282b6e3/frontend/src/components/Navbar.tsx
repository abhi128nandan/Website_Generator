import { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Menu, X } from 'lucide-react';

interface NavbarProps {
  appName: string;
  isAuthenticated?: boolean;
  onThemeToggle?: () => void;
  onMenuToggle?: () => void;
  onLogout?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({
  appName,
  isAuthenticated = false,
  onThemeToggle,
  onMenuToggle,
  onLogout,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (onThemeToggle) {
      onThemeToggle();
    }
  }, [isDarkMode, onThemeToggle]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (onMenuToggle) {
      onMenuToggle();
    }
  };

  return (
    <nav className="w-full bg-white dark:bg-gray-900 shadow-md flex items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex items-center">
        <button
          onClick={toggleMenu}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 sm:hidden"
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
        <div className="ml-4 text-lg font-bold text-gray-800 dark:text-white">
          {appName}
        </div>
      </div>

      <div className="hidden md:flex items-center space-x-4">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 transition duration-200"
          aria-label="Toggle theme"
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        {isAuthenticated ? (
          <button
            onClick={onLogout}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Logout
          </button>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded-md transition duration-200"
          >
            Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;