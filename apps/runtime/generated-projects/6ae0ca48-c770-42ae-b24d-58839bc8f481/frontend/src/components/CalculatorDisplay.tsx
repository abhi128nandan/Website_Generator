import { Equal, Divide, Minus, Plus } from 'lucide-react';

interface CalculatorDisplayProps {
  value: string;
  operation?: string;
  result?: string;
  error?: string;
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({ value, operation, result, error }) => {
  return (
    <div className="w-full h-32 bg-gray-800 text-white p-4 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl">
      {error ? (
        <div className="text-red-500 text-sm font-bold h-full flex items-center justify-center">
          {error}
        </div>
      ) : (
        <div className="flex flex-col h-full justify-end">
          <div className="text-xs text-gray-400 mb-1">{operation}</div>
          <div className="text-2xl font-mono">
            {value}
          </div>
          {result && (
            <div className="text-sm text-gray-300 mt-2">
              Result: {result}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalculatorDisplay;