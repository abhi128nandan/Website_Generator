import React, { useState } from 'react'
import { Equal, Divide, Minus, Plus } from 'lucide-react'
import CalculatorDisplay from '../components/CalculatorDisplay'
import CalculatorButton from '../components/CalculatorButton'

interface CalculatorPageProps {}

const CalculatorPage: React.FC<CalculatorPageProps> = () => {
  const [displayValue, setDisplayValue] = useState('0')
  const [currentValue, setCurrentValue] = useState('')
  const [currentOperator, setCurrentOperator] = useState< '+' | '-' | '*' | '/' | null>(null)
  const [waitingForOperand, setWaitingForOperand] = useState(false)

  const handleNumber = (number: string) => {
    if (waitingForOperand) {
      setDisplayValue(number)
      setWaitingForOperand(false)
    } else {
      setDisplayValue(displayValue === '0' ? number : displayValue + number)
    }
  }

  const handleOperator = (operator: '+' | '-' | '*' | '/') => {
    const inputValue = parseFloat(displayValue)
    
    if (currentValue && currentOperator && !waitingForOperand) {
      const currentValueToUse = currentValue
      const operatorToUse = currentOperator
      const newValue = calculate(parseFloat(currentValueToUse), inputValue, operatorToUse)
      setDisplayValue(newValue.toString())
      setCurrentValue(newValue.toString())
    } else {
      setCurrentValue(inputValue.toString())
    }
    
    setCurrentOperator(operator)
    setWaitingForOperand(true)
  }

  const handleEquals = () => {
    if (currentValue && currentOperator && !waitingForOperand) {
      const newValue = calculate(
        parseFloat(currentValue),
        parseFloat(displayValue),
        currentOperator
      )
      setDisplayValue(newValue.toString())
      setCurrentValue('')
      setCurrentOperator(null)
    }
  }

  const handleClear = () => {
    setDisplayValue('0')
    setCurrentValue('')
    setCurrentOperator(null)
    setWaitingForOperand(false)
  }

  const calculate = (
    firstOperand: number,
    secondOperand: number,
    operator: '+' | '-' | '*' | '/'
  ): number => {
    switch (operator) {
      case '+':
        return firstOperand + secondOperand
      case '-':
        return firstOperand - secondOperand
      case '*':
        return firstOperand * secondOperand
      case '/':
        return secondOperand !== 0 ? firstOperand / secondOperand : NaN
      default:
        return secondOperand
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <CalculatorDisplay
        value={displayValue}
        fontSize="text-5xl"
        colorClass="text-gray-900"
        backgroundColorClass="bg-gray-100"
        paddingClass="p-8"
      />
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs mt-4">
        {/* Row 1 */}
        <CalculatorButton
          value="7"
          onClick={() => handleNumber('7')}
        />
        <CalculatorButton
          value="8"
          onClick={() => handleNumber('8')}
        />
        <CalculatorButton
          value="9"
          onClick={() => handleNumber('9')}
        />
        <CalculatorButton
          value="/"
          isOperator
          onClick={() => handleOperator('/')}
        />
        
        {/* Row 2 */}
        <CalculatorButton
          value="4"
          onClick={() => handleNumber('4')}
        />
        <CalculatorButton
          value="5"
          onClick={() => handleNumber('5')}
        />
        <CalculatorButton
          value="6"
          onClick={() => handleNumber('6')}
        />
        <CalculatorButton
          value="*"
          isOperator
          onClick={() => handleOperator('*')}
        />
        
        {/* Row 3 */}
        <CalculatorButton
          value="1"
          onClick={() => handleNumber('1')}
        />
        <CalculatorButton
          value="2"
          onClick={() => handleNumber('2')}
        />
        <CalculatorButton
          value="3"
          onClick={() => handleNumber('3')}
        />
        <CalculatorButton
          value="-"
          isOperator
          onClick={() => handleOperator('-')}
        />
        
        {/* Row 4 */}
        <CalculatorButton
          value="0"
          onClick={() => handleNumber('0')}
        />
        <CalculatorButton
          value="."
          onClick={() => handleNumber('.')}
        />
        <CalculatorButton
          value="="
          isOperator
          onClick={handleEquals}
        />
        <CalculatorButton
          value="+"
          isOperator
          onClick={() => handleOperator('+')}
        />
        
        {/* Row 5 (Clear) */}
        <CalculatorButton
          value="C"
          isFunction
          onClick={handleClear}
          className="col-span-4"
        />
      </div>
    </div>
  )
}

export default CalculatorPage