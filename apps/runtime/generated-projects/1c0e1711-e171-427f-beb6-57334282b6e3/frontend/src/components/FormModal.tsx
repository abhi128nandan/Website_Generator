import { useState } from "react";
import { X, Check } from "lucide-react";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: Record<string, any>) => void;
  title: string;
  children: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitLabel = "Save",
  cancelLabel = "Cancel",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      const form = e.target as HTMLFormElement;
      const formData = new FormData(form);
      const formObject = Object.fromEntries(formData);
      onSubmit(formObject);
      setIsSubmitting(false);
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 transition-opacity duration-300">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 scale-95 opacity-0 animate-in fade-in zoom-in-95">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">{children}</div>
          <div className="mt-6 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <Loader className="w-4 h-4 mr-1 animate-spin" />
                  <span>Processing...</span>
                </span>
              ) : (
                <span className="flex items-center">
                  <Check className="w-4 h-4 mr-1" />
                  {submitLabel}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FormModal;