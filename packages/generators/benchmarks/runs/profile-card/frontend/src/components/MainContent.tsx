import { Sun, Moon, Edit, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface MainContentProps {
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function MainContent({ user, onEdit, onDelete }: MainContentProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      <div className="flex flex-col md:flex-row">
        <div className="h-48 md:h-auto md:w-48 flex-none bg-gray-100 dark:bg-gray-800 overflow-hidden">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name || 'User Avatar'}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <span className="text-5xl">👤</span>
            </div>
          )}
        </div>
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {user?.name || 'Unnamed User'}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
              {user?.email || 'No email provided'}
            </p>
          </div>
          <div className="flex space-x-3">
            {onEdit && (
              <button
                onClick={onEdit}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
        >
          {isDarkMode ? (
            <>
              <Sun className="w-5 h-5 mr-1" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="w-5 h-5 mr-1" />
              Dark Mode
            </>
          )}
        </button>
      </div>
    </div>
  );
}