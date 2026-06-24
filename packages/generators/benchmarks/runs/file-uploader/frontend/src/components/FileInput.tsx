import { useState } from 'react';
import { Cloud, Check } from 'lucide-react';

interface FileInputProps {
  onUpload: (file: File | null) => void;
}

export default function FileInput({ onUpload }: FileInputProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = () => {
    onUpload(selectedFile);
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-500 dark:text-blue-300">
          <Cloud className="w-8 h-8" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Choose a file</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">or drag and drop it here</p>
        </div>

        <div className="w-full">
          <input
            type="file"
            onChange={handleFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 dark:text-gray-400 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
          >
            Browse files
          </label>
        </div>

        {selectedFile && (
          <div className="mt-3 w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-xs">{selectedFile.name}</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selectedFile.size} bytes
            </span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!selectedFile}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Upload
        </button>
      </div>
    </div>
  );
}