import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

interface CounterComponentProps {
  initialCount?: number;
}

const CounterComponent: React.FC<CounterComponentProps> = ({ initialCount = 0 }) => {
  const [count, setCount] = useState<number>(initialCount);

  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 transition-colors duration-300">
      <div className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">{count}</div>
      <div className="flex space-x-4">
        <button
          onClick={increment}
          className="flex items-center justify-center p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-50 shadow-sm transform hover:scale-105 active:scale-95"
        >
          <Plus size={20} />
        </button>
        <button
          onClick={decrement}
          className="flex items-center justify-center p-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 shadow-sm transform hover:scale-105 active:scale-95"
        >
          <Minus size={20} />
        </button>
      </div>
    </div>
  );
};

export default CounterComponent;