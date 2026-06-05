import { useState, useEffect } from 'react';
import { Display } from '../components/Display';
import { ButtonGrid } from '../components/ButtonGrid';
import { ResponsiveLayout } from '../components/ResponsiveLayout';
import { KeyboardHandler } from '../components/KeyboardHandler';

export default function CalculatorPage() {
  const {
    result,
    previousValue,
    clear,
    deleteLast,
    appendOperator,
    appendNumber,
    calculateResult
  } = useCalculator();

  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    if (result !== null) {
      setHistory(prev => [...prev, `${previousValue} = ${result}`]);
    }
  }, [result, previousValue]);

  const handleKeyPress = (key: string) => {
    if (key === 'Backspace') deleteLast();
    else if (key === 'Enter') calculateResult();
    else if (/[+\-*/]/.test(key)) appendOperator(key);
    else if (/\d/.test(key)) appendNumber(key);
  };

  return (
    <ResponsiveLayout>
      <KeyboardHandler onKeyPress={handleKeyPress}>
        <div className="calculator">
          <Display result={result} previousValue={previousValue} />
          <ButtonGrid>
            <button
              onClick={clear}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            >
              Clear
            </button>
            <button
              onClick={deleteLast}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Delete
            </button>
            {/* Operation buttons */}
            <button
              onClick={() => appendOperator('+')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              +
            </button>
            <button
              onClick={() => appendOperator('-')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              -
            </button>
            <button
              onClick={() => appendOperator('*')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              ×
            </button>
            <button
              onClick={() => appendOperator('/')}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              ÷
            </button>
            {/* Number buttons */}
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map(num => (
              <button
                key={num}
                onClick={() => appendNumber(num.toString())}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded"
              >
                {num}
              </button>
            ))}
            <button
              onClick={calculateResult}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            >
              =
            </button>
          </ButtonGrid>
        </div>
      </KeyboardHandler>
    </ResponsiveLayout>
  );
}