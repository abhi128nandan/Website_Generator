import { useEffect, useState } from 'react'

interface CalculatorDisplayProps {
  value: string
  fontSize?: string
  colorClass?: string
  backgroundColorClass?: string
  paddingClass?: string
}

const CalculatorDisplay: React.FC<CalculatorDisplayProps> = ({
  value,
  fontSize = 'text-4xl',
  colorClass = 'text-gray-800',
  backgroundColorClass = 'bg-gray-100',
  paddingClass = 'p-6',
}) => {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const darkMediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setIsDark(darkMediaQuery.matches)

    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches)
    darkMediaQuery.addEventListener('change', handleChange)

    return () => {
      darkMediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return (
    <div
      className={`${
        isDark ? 'bg-gray-800 text-white' : backgroundColorClass
      } rounded-t-2xl shadow-lg ${paddingClass} transition-colors duration-300`}
    >
      <div
        className={`${fontSize} font-bold truncate ${colorClass} overflow-hidden whitespace-nowrap`}
      >
        {value || '0'}
      </div>
    </div>
  )
}

export default CalculatorDisplay