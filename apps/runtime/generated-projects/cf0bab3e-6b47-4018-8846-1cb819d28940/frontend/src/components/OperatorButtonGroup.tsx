import { Divide, Minus, Plus, Equal } from 'lucide-react';
import React from 'react';

export interface OperatorButtonGroupProps {
  onOperatorClick: (operator: string) => void;
  isDarkMode?: boolean;
}

export default function OperatorButtonGroup({
  onOperatorClick,
  isDarkMode = false,
}: OperatorButtonGroupProps): JSX.Element {
  const operators = [
    { symbol: '+', icon: <Plus className="w-4 h-4" /> },
    { symbol: '-', icon: <Minus className="w-4 h-4" /> },
    { symbol: '÷', icon: <Divide className="w-4 h-4" /> },
    { symbol: '×', icon: <Equal className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col gap-2">
      {operators.map((op) => (
        <button
          key={op.symbol}
          onClick={() => onOperatorClick(op.symbol)}
          className={`flex items-center justify-center w-14 h-14 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-blue-600 ${
            isDarkMode
              ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500'
              : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
          }`}
        >
          {op.icon}
        </button>
      ))}
    </div>
  );
}