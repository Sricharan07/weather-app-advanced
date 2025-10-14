'use client'

import { format } from 'date-fns'
import { Droplets, Wind } from 'lucide-react'

interface ForecastDisplayProps {
  forecastData: {
    location: string
    country: string
    forecast: Array<{
      date: string
      tempMin: number
      tempMax: number
      description: string
      icon: string
      humidity: number
      windSpeed: number
    }>
  }
}

export default function ForecastDisplay({ forecastData }: ForecastDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">7-Day Forecast</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {forecastData.forecast.map((day, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 pb-5 hover:shadow-md transition-all hover:scale-105 flex flex-col min-h-[280px]"
          >
            {/* Date */}
            <div className="text-center mb-3">
              <p className="text-sm font-semibold text-gray-700">
                {format(new Date(day.date), 'EEE')}
              </p>
              <p className="text-xs text-gray-600">
                {format(new Date(day.date), 'MMM d')}
              </p>
            </div>

            {/* Weather Icon */}
            <div className="flex justify-center mb-3">
              <img
                src={`http://openweathermap.org/img/wn/${day.icon}@2x.png`}
                alt={day.description}
                className="w-16 h-16"
              />
            </div>

            {/* Description */}
            <p className="text-xs text-gray-600 capitalize text-center mb-3 min-h-[2rem] flex items-center justify-center leading-tight">
              {day.description}
            </p>

            {/* Temperature */}
            <div className="text-center mb-3 min-h-[3.5rem] flex flex-col justify-center">
              <p className="text-lg font-bold text-gray-800">
                {Math.round(day.tempMax)}°
              </p>
              <p className="text-sm text-gray-600">
                {Math.round(day.tempMin)}°
              </p>
            </div>

            {/* Additional Details */}
            <div className="space-y-2 mt-auto pt-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Droplets size={14} className="text-blue-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">Humidity</span>
                </div>
                <span className="text-xs font-semibold text-gray-800">
                  {day.humidity}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex items-center gap-1">
                  <Wind size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-xs text-gray-600 whitespace-nowrap">Wind</span>
                </div>
                <span className="text-xs font-semibold text-gray-800 whitespace-nowrap">
                  {day.windSpeed} m/s
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
