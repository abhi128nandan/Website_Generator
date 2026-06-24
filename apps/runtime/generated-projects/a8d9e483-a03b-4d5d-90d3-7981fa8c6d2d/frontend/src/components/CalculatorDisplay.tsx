import { Equal, Divide, Plus, Minus } from 'lucide-react';

interface CalculatorDisplayProps {
  value: string;
  className?: string;
}

export default function CalculatorDisplay({ value, className }: CalculatorDisplayProps) {
  return (
    <div
      className={`text-right text-4xl md:text-5xl font-mono p-6 rounded-t-lg bg-gray-900 text-white shadow-lg transition-all duration-300 overflow-x-auto whitespace-nowrap ${className}`}
    >
      {value}
    </div>
  );
}