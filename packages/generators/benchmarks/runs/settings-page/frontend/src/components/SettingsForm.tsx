import { Moon, Sun, Check, Save } from 'lucide-react';
import { useState } from 'react';

interface SettingsFormProps {
  initialUsername?: string;
  isDarkMode?: boolean;
  onDarkModeToggle?: (isDark: boolean) => void;
  onSave?: (username: string) => void;
  disabled?: boolean;
}

export default function SettingsForm({
  initialUsername = '',
  isDarkMode = false,
  onDarkModeToggle = () => {},
  onSave = () => {},
  disabled = false,
}: SettingsFormProps) {
  const [username, setUsername] = useState(initialUsername);
  const [darkMode, setDarkMode] = useState(isDarkMode);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    onSave(username);
    setDarkMode(darkMode);
    onDarkModeToggle(darkMode);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const isSaveDisabled = username.trim().length === 0;

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-colors duration-300">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">User Settings</h2>
        <div className="flex items-center">
          <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Dark Mode</span>
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            role="switch"
            aria-checked={darkMode}
          >
            <span className="sr-only">Enable dark mode</span>
            <div className="absolute inset-0 bg-gray-200 rounded-full pointer-events-none"></div>
            <span
              className={`${
                darkMode ? 'translate-x-5 bg-gray-800' : 'translate-x-0 bg-gray-400'
              } inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition-transform`}
            />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="block w-full px-4 py-2 text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-150"
          placeholder="Enter your username"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaveDisabled || disabled}
          className={`${
            isSaveDisabled || disabled
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:ring focus:ring-blue-300'
          } inline-flex items-center justify-center px-5 py-2 border border-transparent font-medium rounded-lg text-white shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800`}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </button>
      </div>

      {isSaved && (
        <div className="mt-4 flex items-center text-green-600 dark:text-green-400">
          <Check className="h-5 w-5 mr-2" />
          <span className="text-sm font-medium">Changes saved successfully</span>
        </div>
      )}
    </div>
  );
}