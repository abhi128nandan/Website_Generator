import { useState } from 'react';
import FileInput from '../components/FileInput';
import UploadButton from '../components/UploadButton';

export default function FileUploadPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileUpload = (file: File | null) => {
    setUploadedFile(file);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              File Upload
            </h1>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              <div>
                <FileInput onUpload={handleFileUpload} />
                {uploadedFile && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                    Selected file: {uploadedFile.name}
                  </div>
                )}
              </div>
              <div className="pt-4">
                <UploadButton
                  onUpload={handleFileUpload}
                  className="w-full"
                  label="Upload File"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}