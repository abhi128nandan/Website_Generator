import { Equal, Divide, Minus, Plus } from 'lucide-react'
import React, { ButtonHTMLAttributes, forwardRef } from 'react'

export interface CalculatorButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  isOperator?: boolean
  isFunction?: boolean
  isActive?: boolean
  ariaLabel?: string
}

const CalculatorButton = forwardRef<HTMLButtonElement, CalculatorButtonProps>(
  ({ value, isOperator, isFunction, isActive, ariaLabel, ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        className={`flex h-12 w-12 items-center justify-center rounded-md transition-all duration-200 ${
          isOperator
            ? 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700'
            : isFunction
            ? 'bg-slate-600 text-white hover:bg-slate-500 active:bg-slate-700'
            : 'bg-slate-200 text-slate-800 hover:bg-slate-300 active:bg-slate-400'
        } ${
          isActive
            ? 'ring-2 ring-offset-2 ring-amber-400 scale-105'
            : 'transform hover:scale-105'
        }`}
        {...props}
      >
        {value === '=' ? (
          <Equal className="h-5 w-5" />
        ) : value === '/' ? (
          <Divide className="h-5 w-5" />
        ) : value === '-' ? (
          <Minus className="h-5 w-5" />
        ) : value === '+' ? (
          <Plus className="h-5 w-5" />
        ) : (
          value
        )}
      </button>
    )
  }
)

export default CalculatorButton