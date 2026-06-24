import { Equal, RefreshCw } from 'lucide-react'
import { useState } from 'react'

interface CalculatorActionsProps {
  onCalculate: () => void
  onClear: () => void
  isLoading?: boolean
}

export default function CalculatorActions({
  onCalculate,
  onClear,
  isLoading = false,
}: CalculatorActionsProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [isClearing, setIsClearing] = useState(false)

  const handleCalculate = () => {
    if (isLoading) return
    setIsCalculating(true)
    onCalculate()
    setTimeout(() => setIsCalculating(false), 200)
  }

  const handleClear = () => {
    if (isLoading) return
    setIsClearing(true)
    onClear()
    setTimeout(() => setIsClearing(false), 200)
  }

  return (
    <div className="flex gap-2 justify-center mt-4">
      <button
        onClick={handleClear}
        disabled={isLoading}
        className="w-16 h-16 rounded-lg bg-red-600 text-white flex items-center justify-center text-xl font-bold transition-all duration-200 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Clear"
      >
        <RefreshCw
          size={24}
          className={`transition-transform duration-200 ${isClearing ? 'animate-spin' : ''}`}
        />
      </button>
      <button
        onClick={handleCalculate}
        disabled={isLoading}
        className="w-16 h-16 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xl font-bold transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-label="Calculate"
      >
        <Equal size={24} />
      </button>
    </div>
  )
}