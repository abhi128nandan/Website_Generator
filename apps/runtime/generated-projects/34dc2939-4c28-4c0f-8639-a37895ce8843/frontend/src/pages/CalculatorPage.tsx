import { useCalculator } from '../hooks/useCalculator'
import CalculatorDisplay from '../components/CalculatorDisplay'
import CalculatorButton from '../components/CalculatorButton'
import CalculatorActions from '../components/CalculatorActions'
import React, { useCallback } from 'react'

const CalculatorPage: React.FC = () => {
  const {
    value,
    error,
    isCalculating,
    addNumber,
    addOperator,
    calculateResult,
    clearCalculator,
  } = useCalculator()

  const handleButtonClick = useCallback((buttonValue: string) => {
    if (/^[0-9]$/.test(buttonValue)) {
      addNumber(buttonValue)
    } else if (['+', '-', '*', '/'].includes(buttonValue)) {
      addOperator(buttonValue as '+' | '-' | '*' | '/')
    }
  }, [addNumber, addOperator])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-4 md:p-6">
        <CalculatorDisplay
          value={value}
          error={error}
        />
        <div className="grid grid-cols-4 gap-2 mt-4">
          <CalculatorButton
            value="7"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="8"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="9"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="/"
            type="operator"
            onClick={handleButtonClick}
          />
          
          <CalculatorButton
            value="4"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="5"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="6"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="*"
            type="operator"
            onClick={handleButtonClick}
          />
          
          <CalculatorButton
            value="1"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="2"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="3"
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="-"
            type="operator"
            onClick={handleButtonClick}
          />
          
          <CalculatorButton
            value="0"
            type="number"
            isLarge={true}
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="."
            type="number"
            onClick={handleButtonClick}
          />
          <CalculatorButton
            value="+"
            type="operator"
            onClick={handleButtonClick}
          />
          
          <CalculatorActions
            onCalculate={calculateResult}
            onClear={clearCalculator}
            isLoading={isCalculating}
          />
        </div>
      </div>
    </div>
  )
}

export default CalculatorPage