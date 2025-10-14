'use client'

import { Cloud, Droplets, Wind, Gauge, ThermometerSun } from 'lucide-react'

interface WeatherDisplayProps {
  weatherData: {
    location: string
    country: string
    temperature: number
    feelsLike: number
    tempMin: number
    tempMax: number
    humidity: number
    pressure: number
    windSpeed: number
    clouds: number
    description: string
    icon: string
  }
}

export default function WeatherDisplay({ weatherData }: WeatherDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">
            {weatherData.location}, {weatherData.country}
          </h2>
          <p className="text-lg text-gray-600 capitalize mt-1">
            {weatherData.description}
          </p>
        </div>
        <img
          src={`http://openweathermap.org/img/wn/${weatherData.icon}@2x.png`}
          alt={weatherData.description}
          className="w-20 h-20"
        />
      </div>

      <div className="flex items-center justify-center mb-6">
        <div className="text-6xl font-bold text-blue-600">
          {Math.round(weatherData.temperature)}°C
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <ThermometerSun className="text-blue-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Feels Like</p>
            <p className="text-lg font-semibold text-gray-800">
              {Math.round(weatherData.feelsLike)}°C
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <ThermometerSun className="text-orange-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Min / Max</p>
            <p className="text-lg font-semibold text-gray-800">
              {Math.round(weatherData.tempMin)}° / {Math.round(weatherData.tempMax)}°
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <Droplets className="text-blue-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Humidity</p>
            <p className="text-lg font-semibold text-gray-800">
              {weatherData.humidity}%
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <Gauge className="text-purple-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Pressure</p>
            <p className="text-lg font-semibold text-gray-800">
              {weatherData.pressure} hPa
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <Wind className="text-green-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Wind Speed</p>
            <p className="text-lg font-semibold text-gray-800">
              {weatherData.windSpeed} m/s
            </p>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
          <Cloud className="text-gray-500" size={24} />
          <div>
            <p className="text-sm text-gray-600">Clouds</p>
            <p className="text-lg font-semibold text-gray-800">
              {weatherData.clouds}%
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
