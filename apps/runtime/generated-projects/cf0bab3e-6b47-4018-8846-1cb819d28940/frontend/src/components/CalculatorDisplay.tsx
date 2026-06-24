import { createContext, useContext, useState, ReactNode, useEffect } from 'react'

interface CalculatorDisplayProps {
  value: string
  onClear?: () => void
}

const CalculatorDisplay = ({ value, onClear }: CalculatorDisplayProps) => {
  return (
    <div className="w-full h-24 bg-gray-900 text-white text-4xl font-mono text-right p-4 rounded-lg shadow-lg border border-gray-700">
      <div className="overflow-auto">
        {value || '0'}
      </div>
      <button
        onClick={onClear}
        className="absolute bottom-2 right-4 text-gray-400 hover:text-red-500 transition-colors text-sm"
      >
        Clear
      </button>
    </div>
  )
}

export default CalculatorDisplay