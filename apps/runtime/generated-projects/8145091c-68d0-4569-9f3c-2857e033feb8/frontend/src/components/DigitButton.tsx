import React from 'react';

interface DigitButtonProps {
  value: string;
  onClick: (digit: string) => void;
  disabled?: boolean;
}

const DigitButton: React.FC<DigitButtonProps> = ({ value, onClick, disabled = false }) => {
  return (
    <button
      className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 
        bg-gray-200 text-gray-800 shadow-sm hover:bg-gray-300 active:bg-gray-400 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
        dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 dark:active:bg-gray-500 
        dark:focus:ring-blue-400 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={() => onClick(value)}
      disabled={disabled}
      aria-label={`Digit ${value}`}
    >
      {value}
    </button>
  );
};

export default DigitButton;