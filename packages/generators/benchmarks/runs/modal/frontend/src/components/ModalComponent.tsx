import { X } from 'lucide-react';
import { useState } from 'react';

export interface ModalComponentProps {
  isOpen?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
}

const ModalComponent: React.FC<ModalComponentProps> = ({ isOpen = false, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm transition-opacity duration-300"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-auto rounded-lg bg-white p-6 shadow-2xl dark:bg-gray-900 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200 hover:text-gray-800 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white focus:outline-none"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
};

export default ModalComponent;