import React from 'react';

const CalculatorGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-4 gap-2 p-2">
      <button className="bg-gray-200 p-4 rounded">Clear</button>
      <button className="bg-gray-200 p-4 rounded">Delete</button>
      <button className="bg-gray-200 p-4 rounded">%</button>
      <button className="bg-gray-200 p-4 rounded">÷</button>
      
      <button className="bg-gray-200 p-4 rounded">7</button>
      <button className="bg-gray-200 p-4 rounded">8</button>
      <button className="bg-gray-200 p-4 rounded">9</button>
      <button className="bg-gray-200 p-4 rounded">×</button>
      
      <button className="bg-gray-200 p-4 rounded">4</button>
      <button className="bg-gray-200 p-4 rounded">5</button>
      <button className="bg-gray-200 p-4 rounded">6</button>
      <button className="bg-gray-200 p-4 rounded">−</button>
      
      <button className="bg-gray-200 p-4 rounded">1</button>
      <button className="bg-gray-200 p-4 rounded">2</button>
      <button className="bg-gray-200 p-4 rounded">3</button>
      <button className="bg-gray-200 p-4 rounded">+</button>
      
      <button className="bg-gray-200 p-4 rounded col-span-2">0</button>
      <button className="bg-gray-200 p-4 rounded">.</button>
      <button className="bg-gray-200 p-4 rounded">=</button>
    </div>
  );
};

export default CalculatorGrid;