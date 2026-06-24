import { useCalculator } from '../hooks/useCalculator'
import CalculatorDisplay from '../components/CalculatorDisplay'
import NumberButtonGroup from '../components/NumberButtonGroup'
import OperatorButtonGroup from '../components/OperatorButtonGroup'
import { X } from 'lucide-react'
import React from 'react'

  export default function CalculatorPage() {
  const {
    displayValue,
    currentOperator,
    previousValue,
    result,
    error,
    onNumberClick,
    onOperatorClick,
    onClear,
    onEqualsClick
  } = useCalculator()

  const renderDisplayValue = (): string => {
    if (error) return error
    if (result !== null) return result.toString()
    if (displayValue) return displayValue
    return '0'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-xs bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 flex justify-between items-center">
          <CalculatorDisplay value={renderDisplayValue()} onClear={onClear} />
          <button
            onClick={onClear}
            className="p-2 rounded-full hover:bg-gray-200"
            aria-label="Clear"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2 p-2 bg-gray-200">
          <NumberButtonGroup className="col-span-3" />
          <OperatorButtonGroup
            onOperatorClick={onOperatorClick}
            isDarkMode={false}
          />
        </div>
        <div className="p-2 flex justify-center">
          <button
            onClick={onEqualsClick}
            className="w-32 py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            =
          </button>
        </div>
      </div>
    </div>
  )
}