import React from 'react';

interface ButtonGridProps {
  onAction: (action: string) => void;
}

const ButtonGrid: React.FC<ButtonGridProps> = ({ onAction }) => (
  <div className="grid grid-cols-4 gap-2">
    <button className="col-span-2 bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('C')}>
      Clear
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('DEL')}>
      Delete
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('/')}>
      ÷
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('7')}>
      7
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('8')}>
      8
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('9')}>
      9
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('*')}>
      ×
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('4')}>
      4
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('5')}>
      5
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('6')}>
      6
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('-')}>
      −
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('1')}>
      1
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('2')}>
      2
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('3')}>
      3
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('+')}>
      +
    </button>
    <button className="col-span-2 bg-blue-500 text-white font-bold py-2 px-4 rounded" onClick={() => onAction('0')}>
      0
    </button>
    <button className="bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded" onClick={() => onAction('.')}>
      .
    </button>
    <button className="bg-green-500 text-white font-bold py-2 px-4 rounded" onClick={() => onAction('=')}>
      =
    </button>
  </div>
);

export default ButtonGrid;