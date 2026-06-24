import { Equal, Divide, Minus, Plus } from 'lucide-react';
import React, { useState } from 'react';

export interface CalculatorKeypadProps {
  onNumberClick: (number: string) => void;
  onOperatorClick: (operator: string) => void;
  onEqualsClick: () => void;
  onClearClick: () => void;
}

const CalculatorKeypad: React.FC<CalculatorKeypadProps> = ({
  onNumberClick,
  onOperatorClick,
  onEqualsClick,
  onClearClick,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <div className="grid grid-cols-4 gap-4 mt-4 px-4 pb-4">
      <button
        type="button"
        onClick={() => onNumberClick('7')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        7
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('8')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        8
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('9')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        9
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('/')}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
      >
        <Divide className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => onNumberClick('4')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        4
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('5')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        5
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('6')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        6
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('*')}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
      >
        ×
      </button>

      <button
        type="button"
        onClick={() => onNumberClick('1')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        1
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('2')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        2
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('3')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        3
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('-')}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
      >
        <Minus className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={() => onClearClick()}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 col-span-2"
      >
        Clear
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('0')}
        className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95"
      >
        0
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('+')}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
      >
        <Plus className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={() => onEqualsClick()}
        className="bg-green-500 hover:bg-green-600 text-white rounded-lg h-16 font-medium transition-all duration-150 active:scale-95 flex items-center justify-center"
      >
        <Equal className="w-5 h-5" />
      </button>
    </div>
  );
};

export default CalculatorKeypad;