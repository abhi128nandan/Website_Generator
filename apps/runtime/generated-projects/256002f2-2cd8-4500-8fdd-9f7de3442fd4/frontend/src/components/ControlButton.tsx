import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface ControlButtonProps {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

const ControlButton: React.FC<ControlButtonProps> = ({ 
  label, 
  icon, 
  onClick, 
  variant = 'primary' 
}) => {
  const buttonClass = variant === 'secondary' 
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-blue-600 hover:bg-blue-700 text-white';

  return (
    <button
      className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${buttonClass}`}
      onClick={onClick}
    >
      <span className="sr-only">{label}</span>
      <span>{icon}</span>
    </button>
  );
};

export default ControlButton;