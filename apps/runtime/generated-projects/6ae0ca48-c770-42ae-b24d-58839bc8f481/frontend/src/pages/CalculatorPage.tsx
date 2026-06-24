import { useCalculator } from '../hooks/useCalculator';
import CalculatorDisplay from '../components/CalculatorDisplay';
import CalculatorButtonGrid from '../components/CalculatorButtonGrid';

export default function CalculatorPage() {
  const {
    value,
    operation,
    result,
    error,
    onNumberClick,
    onOperatorClick,
    onClear,
    onCalculate
  } = useCalculator();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <CalculatorDisplay
          value={value ?? ''}
          operation={operation}
          result={result}
          error={error}
        />
        <CalculatorButtonGrid
          onNumberClick={onNumberClick}
          onOperatorClick={onOperatorClick}
          onClear={onClear}
          onCalculate={onCalculate}
        />
      </div>
    </div>
  );
}