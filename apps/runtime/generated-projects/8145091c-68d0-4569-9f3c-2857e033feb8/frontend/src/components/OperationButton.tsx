import React from 'react';

interface CalculatorDisplayProps {
  value: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ value }) => {
  return (
    <div className="w-full bg-gray-800 text-white text-4xl font-bold p-4 rounded-t-lg text-right overflow-hidden">
      <span>{value}</span>
    </div>
  );
};

export default CalculatorDisplay;