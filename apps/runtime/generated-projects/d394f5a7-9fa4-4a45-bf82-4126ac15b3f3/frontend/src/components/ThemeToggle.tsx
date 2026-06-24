import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export interface ThemeToggleProps {
  onThemeChange?: (theme: 'light' | 'dark') => void;
  isDarkMode?: boolean;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({
  onThemeChange,
  isDarkMode = false,
  className = '',
}) => {
  const [darkMode, setDarkMode] = useState(isDarkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (onThemeChange) {
      onThemeChange(newMode ? 'dark' : 'light');
    }
  };

  return (
    <button
      className={`relative h-12 w-24 rounded-full bg-gray-200 dark:bg-gray-700 p-1 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-300 ${className}`}
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1 left-1 flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-gray-900 transition-transform duration-300 ${darkMode ? 'translate-x-full' : 'translate-x-0'}`}
      >
        {darkMode ? (
          <Moon className="h-5 w-5 text-gray-900 dark:text-gray-100" />
        ) : (
          <Sun className="h-5 w-5 text-gray-900 dark:text-gray-100" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;