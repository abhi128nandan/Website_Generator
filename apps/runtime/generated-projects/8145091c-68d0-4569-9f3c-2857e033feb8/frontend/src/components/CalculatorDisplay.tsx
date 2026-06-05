import React from 'react';

interface CalculatorDisplayProps {
  currentExpression?: string;
  result?: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ currentExpression, result }) => {
  return (
    <div className="p-4 rounded-lg bg-gray-900 text-white shadow-lg">
      <div className="text-sm text-gray-400 overflow-x-auto whitespace-nowrap">{currentExpression || '0'}</div>
      <div className="text-2xl md:text-3xl overflow-x-auto whitespace-nowrap mt-1">{result || '0'}</div>
    </div>
  );
};

export default CalculatorDisplay;