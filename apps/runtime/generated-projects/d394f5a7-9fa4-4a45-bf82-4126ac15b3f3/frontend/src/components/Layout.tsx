import { Sun, Moon, Search } from 'lucide-react';
import { useState, useEffect } from 'react';

interface LayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  isDarkMode?: boolean;
  toggleDarkMode?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  headerTitle = 'WeatherGlass Dashboard', 
  isDarkMode = false,
  toggleDarkMode 
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
        <div className="container mx-auto px-4 py-4 md:px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-400 dark:from-blue-400 dark:to-cyan-300">
              {headerTitle}
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-yellow-400" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
            
            <button
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 md:px-6 max-w-7xl">
        {children}
      </main>

      <footer className="py-6 border-t border-gray-200 dark:border-gray-700 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Weather data provided by WeatherGlass API</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;