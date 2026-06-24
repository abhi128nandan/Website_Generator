import React from 'react'

const CalculatorPage: React.FC = () => {
  const [display, setDisplay] = React.useState<string>('0')
  const [currentValue, setCurrentValue] = React.useState<string>('')
  const [operator, setOperator] = React.useState<string | null>(null)
  const [waitingForOperand, setWaitingForOperand] = React.useState<boolean>(true)

  const handleNumber = (value: string) => {
    if (waitingForOperand) {
      setDisplay(value)
      setWaitingForOperand(false)
    } else {
      setDisplay(display + value)
    }
  }

  const handleOperator = (nextOperator: string) => {
    const inputValue = parseFloat(display)
    const previousValue = parseFloat(currentValue)

    if (operator && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operator)
      setDisplay(result.toString())
      setCurrentValue(result.toString())
    } else {
      setCurrentValue(inputValue.toString())
    }

    setOperator(nextOperator)
    setWaitingForOperand(true)
  }

  const handleEquals = () => {
    const inputValue = parseFloat(display)
    const previousValue = parseFloat(currentValue)

    if (operator && !waitingForOperand) {
      const result = calculate(previousValue, inputValue, operator)
      setDisplay(result.toString())
      setCurrentValue(result.toString())
      setOperator(null)
      setWaitingForOperand(true)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setCurrentValue('')
    setOperator(null)
    setWaitingForOperand(true)
  }

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b
      case '-':
        return a - b
      case '*':
        return a * b
      case '/':
        return b !== 0 ? a / b : 0
      default:
        return b
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="w-full max-w-xs bg-white rounded-lg shadow-md p-4">
        <div className="calculator-display text-right font-mono text-2xl mb-4 p-2 bg-gray-200 rounded">
          {display}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <button
            className="col-span-1 p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={handleClear}
          >
            C
          </button>
          <button
            className="col-span-1 p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleOperator('/')}
          >
            ÷
          </button>
          <button
            className="col-span-1 p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleOperator('*')}
          >
            ×
          </button>
          <button
            className="col-span-1 p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleOperator('-')}
          >
            −
          </button>

          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('7')}
          >
            7
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('8')}
          >
            8
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('9')}
          >
            9
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleOperator('+')}
          >
            +
          </button>

          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('4')}
          >
            4
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('5')}
          >
            5
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('6')}
          >
            6
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('0')}
          >
            0
          </button>

          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('1')}
          >
            1
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('2')}
          >
            2
          </button>
          <button
            className="p-4 text-lg font-medium bg-gray-200 rounded hover:bg-gray-300 transition-colors"
            onClick={() => handleNumber('3')}
          >
            3
          </button>
          <button
            className="p-4 text-lg font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            onClick={handleEquals}
          >
            =
          </button>
        </div>
      </div>
    </div>
  )
}

export default CalculatorPage