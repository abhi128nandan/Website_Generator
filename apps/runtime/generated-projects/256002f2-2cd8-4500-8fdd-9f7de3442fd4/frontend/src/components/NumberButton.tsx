import React from 'react';

interface NumberButtonProps {
  value: string;
  onClick: (value: string) => void;
}

const NumberButton: React.FC<NumberButtonProps> = ({ value, onClick }) => {
  return (
    <button
      className="bg-gray-800 text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded-lg px-4 py-2 transition-all duration-200 active:scale-95"
      onClick={() => onClick(value)}
    >
      {value}
    </button>
  );
};

export default NumberButton;