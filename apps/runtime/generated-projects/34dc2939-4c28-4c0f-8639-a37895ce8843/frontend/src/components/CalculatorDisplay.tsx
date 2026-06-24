import { useState, useEffect } from "react";

interface CalculatorDisplayProps {
  value: string;
  error?: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ value, error }) => {
  return (
    <div className="w-full h-32 bg-gray-800 rounded-t-lg p-4 flex items-center justify-center overflow-hidden">
      <div
        className={`text-right w-full text-2xl md:text-3xl lg:text-4xl font-mono transition-all duration-200 ${
          error ? "text-red-500" : "text-white"
        } whitespace-nowrap overflow-x-auto`}
      >
        {error ? error : value}
      </div>
    </div>
  );
};

export default CalculatorDisplay;