import React, { useState, useEffect } from 'react';

interface CalculatorDisplayProps {
  currentInput: string;
  result: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ currentInput, result }) => {
  const [displayValue, setDisplayValue] = useState<string>('');

  useEffect(() => {
    if (currentInput) {
      setDisplayValue(currentInput);
    } else if (result) {
      setDisplayValue(result);
    }
  }, [currentInput, result]);

  return (
    <div className="w-full h-24 bg-gray-800 text-white p-4 rounded-lg flex flex-col justify-end">
      <div className="text-right text-sm text-gray-400 mb-1">{result}</div>
      <div className="text-right text-2xl font-mono whitespace-pre">{displayValue}</div>
    </div>
  );
};

export default CalculatorDisplay;