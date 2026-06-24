import { Sun, Moon } from 'lucide-react';
import { useState } from 'react';

export default function DarkModeToggle() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow transition-all duration-300">
      <div className="flex items-center space-x-2">
        <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
          {isDarkMode ? <Moon size={16} className="text-white" /> : <Sun size={16} className="text-yellow-500" />}
        </div>
        <span className="text-sm font-medium text-gray-800 dark:text-white">Dark Mode</span>
      </div>
      <button
        onClick={toggleDarkMode}
        className="relative inline-flex items-center h-6 rounded-full w-12 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <span
          className={`absolute w-5 h-5 bg-white dark:bg-gray-800 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
            isDarkMode ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}