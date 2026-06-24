import { Sun, Cloud, Wind, Droplets, Thermometer } from 'lucide-react'
import React from 'react'

interface ForecastCardProps {
  date: string
  icon: 'sun' | 'cloud' | 'rain' | 'snow' | 'wind'
  temperature: number
  condition: string
  precipitation?: number
  windSpeed?: number
  onClick?: () => void
}

const ForecastCard: React.FC<ForecastCardProps> = ({
  date,
  icon,
  temperature,
  condition,
  precipitation,
  windSpeed,
  onClick,
}) => {
  const getIconComponent = () => {
    switch (icon) {
      case 'sun':
        return <Sun className="w-8 h-8 text-yellow-400" />
      case 'cloud':
        return <Cloud className="w-8 h-8 text-gray-400" />
      case 'rain':
        return <Droplets className="w-8 h-8 text-blue-400" />
      case 'snow':
        return <Cloud className="w-8 h-8 text-blue-300" />
      case 'wind':
        return <Wind className="w-8 h-8 text-cyan-400" />
      default:
        return <Cloud className="w-8 h-8 text-gray-400" />
    }
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 transition hover:shadow-lg cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{date}</div>
        <div className="text-sm font-medium text-gray-700 dark:text-gray-200">{temperature}°</div>
      </div>
      <div className="flex items-center mb-3">
        <div className="mr-3">{getIconComponent()}</div>
        <div className="text-sm font-medium capitalize text-gray-800 dark:text-gray-100">{condition}</div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        {precipitation !== undefined && (
          <div className="flex items-center">
            <Droplets className="w-4 h-4 mr-1" />
            <span>{precipitation}%</span>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="flex items-center">
            <Wind className="w-4 h-4 mr-1" />
            <span>{windSpeed} mph</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default ForecastCard