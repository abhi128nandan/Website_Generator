import React from 'react';

interface DisplayProps {
  currentExpression: string;
  result: string;
}

const Display: React.FC<DisplayProps> = ({ currentExpression, result }) => {
  return (
    <div className="bg-gray-900 rounded-lg p-4 shadow-md max-w-md mx-auto">
      <div className="text-gray-400 text-sm md:text-base text-right truncate">
        {currentExpression}
      </div>
      <div className="text-white text-4xl md:text-5xl lg:text-6xl text-right truncate font-bold">
        {result}
      </div>
    </div>
  );
};

export default Display;