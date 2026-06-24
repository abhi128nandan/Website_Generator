import { useState } from "react";
import { Cloud, Check } from "lucide-react";

interface UploadButtonProps {
  onUpload: (file: File | null) => void;
  className?: string;
  label?: string;
}

const UploadButton: React.FC<UploadButtonProps> = ({ onUpload, className = "", label = "Choose File" }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
    setFileName(file ? file.name : null);
    onUpload(file);
  };

  return (
    <div className={`flex flex-col items-center justify-center w-full gap-4 ${className}`}>
      <div className="flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors duration-200">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 p-4 rounded-lg cursor-pointer">
          <div className="flex flex-col items-center justify-center pb-6">
            <Cloud className="w-12 h-12 text-blue-500 mb-3" />
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">Supported files: PDF, DOCX, XLSX</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {fileName && (
        <div className="flex items-center justify-between w-full max-w-md px-4 py-2 bg-white rounded-md shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2">
            <Check className="w-4 h-4 text-green-500" />
            <span className="text-sm text-gray-700">{fileName}</span>
          </div>
          <button
            type="button"
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
            onClick={() => {
              setSelectedFile(null);
              setFileName(null);
              onUpload(null);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadButton;