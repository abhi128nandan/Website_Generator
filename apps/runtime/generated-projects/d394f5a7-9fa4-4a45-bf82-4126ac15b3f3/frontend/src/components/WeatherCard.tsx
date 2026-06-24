import { Sun, Cloud, Wind, Droplets, Thermometer } from 'lucide-react'
import React from 'react'

export interface WeatherCardProps {
  city?: string
  temperature?: number
  condition?: string
  humidity?: number
  windSpeed?: number
  isLoading?: boolean
  isError?: boolean
  className?: string
}

const WeatherCard: React.FC<WeatherCardProps> = ({
  city = 'Unknown City',
  temperature = 0,
  condition = 'Clear',
  humidity = 0,
  windSpeed = 0,
  isLoading = false,
  isError = false,
  className = '',
}) => {
  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className="w-16 h-16 text-yellow-400 animate-pulse" />
      case 'cloudy':
      case 'overcast':
        return <Cloud className="w-16 h-16 text-gray-500 animate-bounce" />
      case 'rain':
      case 'showers':
        return <Droplets className="w-16 h-16 text-blue-500 animate-ping" />
      case 'snow':
        return <Cloud className="w-16 h-16 text-white animate-pulse" />
      case 'windy':
        return <Wind className="w-16 h-16 text-blue-400 animate-spin" />
      default:
        return <Cloud className="w-16 h-16 text-gray-500" />
    }
  }

  return (
    <div
      className={`rounded-xl shadow-xl overflow-hidden transition-all transform hover:scale-[1.02] bg-white dark:bg-gray-800 ${className}`}
    >
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{city}</h2>
          {isLoading && (
            <div className="flex items-center">
              <Loader className="w-5 h-5 text-blue-500 animate-spin" />
            </div>
          )}
          {isError && (
            <div className="flex items-center text-red-500">
              <AlertCircle className="w-5 h-5" />
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <div className="text-center">
            <div className="text-6xl font-bold text-gray-800 dark:text-white">
              {temperature}°
            </div>
            <div className="text-lg text-gray-600 dark:text-gray-300 capitalize">
              {condition}
            </div>
          </div>
          <div className="text-center">
            <div className="mb-2">{getWeatherIcon(condition)}</div>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Thermometer className="w-5 h-5 mr-2 text-red-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Temperature</span>
            <span className="ml-1 font-medium text-gray-800 dark:text-white">{temperature}°C</span>
          </div>
          <div className="flex items-center">
            <Wind className="w-5 h-5 mr-2 text-blue-500" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Wind</span>
            <span className="ml-1 font-medium text-gray-800 dark:text-white">{windSpeed} km/h</span>
          </div>
          <div className="flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
            <span className="ml-1 font-medium text-gray-800 dark:text-white">{humidity}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WeatherCard