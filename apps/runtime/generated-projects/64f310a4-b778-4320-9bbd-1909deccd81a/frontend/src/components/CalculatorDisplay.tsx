import React from 'react';

interface CalculatorDisplayProps {
  value: string;
  className?: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ 
  value = '0', 
  className = '' 
}) => {
  return (
    <div className={`bg-gray-900 p-4 rounded-lg text-right font-mono text-white text-3xl sm:text-4xl md:text-5xl tracking-wider min-h-[80px] ${className}`}>
      <div className="overflow-x-auto">
        {value}
      </div>
    </div>
  );
};

export default CalculatorDisplay;