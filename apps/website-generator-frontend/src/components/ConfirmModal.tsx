import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export function ConfirmModal({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  confirmText = 'Confirm', 
  cancelText = 'Cancel',
  isDestructive = true
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0B1020]/80 backdrop-blur-sm">
      <div className="bg-[#121A2F] border border-[#18233D] rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 flex items-start gap-4">
          <div className={`shrink-0 p-2 rounded-full ${isDestructive ? 'bg-[#EF4444]/10 text-[#EF4444]' : 'bg-[#4F8CFF]/10 text-[#4F8CFF]'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-100 mb-1">{title}</h3>
            <p className="text-sm text-gray-400">{message}</p>
          </div>
          <button 
            onClick={onCancel}
            className="shrink-0 p-1 text-gray-500 hover:bg-[#18233D] hover:text-gray-300 rounded-md transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="bg-[#0B1020]/50 p-4 border-t border-[#18233D] flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#18233D] hover:text-white transition-colors"
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors shadow-sm ${
              isDestructive 
                ? 'bg-[#EF4444] hover:bg-[#EF4444]/90' 
                : 'bg-[#4F8CFF] hover:bg-[#4F8CFF]/90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
