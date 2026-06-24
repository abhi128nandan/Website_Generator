import SettingsForm from '../components/SettingsForm';
import { useSettings } from '../hooks/useSettings';
import { useState } from 'react';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { darkMode, username, error, loading, toggleDarkMode, handleUsernameChange, saveChanges } = useSettings();
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    saveChanges();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-300">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Settings</h1>
        
        <div className="max-w-2xl mx-auto">
          <SettingsForm
            initialUsername={username}
            isDarkMode={darkMode}
            onDarkModeToggle={toggleDarkMode}
            onSave={handleSave}
            disabled={loading}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}
          
          {isSaved && (
            <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg flex items-center">
              <Check size={16} className="mr-2" />
              Changes saved successfully
            </div>
          )}
        </div>
      </div>
    </div>
  );
}