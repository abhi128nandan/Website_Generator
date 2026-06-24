import { Equal, Divide, Minus, Plus } from 'lucide-react'
import { useState } from 'react'

interface CalculatorButtonGridProps {
  onNumberClick: (value: string) => void
  onOperatorClick: (operator: string) => void
  onClear: () => void
  onCalculate: () => void
}

export default function CalculatorButtonGrid({
  onNumberClick,
  onOperatorClick,
  onClear,
  onCalculate,
}: CalculatorButtonGridProps) {
  return (
    <div className="grid grid-cols-4 gap-4 w-full max-w-md">
      <button
        type="button"
        onClick={() => onNumberClick('7')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        7
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('8')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        8
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('9')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        9
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('/')}
        className="bg-amber-600 text-white font-bold py-4 rounded-lg shadow hover:bg-amber-500 transition-all active:scale-95 flex items-center justify-center"
      >
        <Divide className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => onNumberClick('4')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        4
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('5')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        5
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('6')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        6
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('*')}
        className="bg-amber-600 text-white font-bold py-4 rounded-lg shadow hover:bg-amber-500 transition-all active:scale-95"
      >
        ×
      </button>

      <button
        type="button"
        onClick={() => onNumberClick('1')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        1
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('2')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        2
      </button>
      <button
        type="button"
        onClick={() => onNumberClick('3')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95"
      >
        3
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('-')}
        className="bg-amber-600 text-white font-bold py-4 rounded-lg shadow hover:bg-amber-500 transition-all active:scale-95"
      >
        <Minus className="h-6 w-6" />
      </button>

      <button
        type="button"
        onClick={() => onNumberClick('0')}
        className="bg-gray-800 text-white font-bold py-4 rounded-lg shadow hover:bg-gray-700 transition-all active:scale-95 col-span-2"
      >
        0
      </button>
      <button
        type="button"
        onClick={onClear}
        className="bg-red-600 text-white font-bold py-4 rounded-lg shadow hover:bg-red-500 transition-all active:scale-95"
      >
        C
      </button>
      <button
        type="button"
        onClick={() => onOperatorClick('+')}
        className="bg-amber-600 text-white font-bold py-4 rounded-lg shadow hover:bg-amber-500 transition-all active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </button>
      <button
        type="button"
        onClick={onCalculate}
        className="bg-green-600 text-white font-bold py-4 rounded-lg shadow hover:bg-green-500 transition-all active:scale-95"
      >
        <Equal className="h-6 w-6" />
      </button>
    </div>
  )
}