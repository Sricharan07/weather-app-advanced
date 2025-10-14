'use client'

import { useState } from 'react'
import WeatherSearch from '@/components/WeatherSearch'
import WeatherDisplay from '@/components/WeatherDisplay'
import ForecastDisplay from '@/components/ForecastDisplay'
import SavedQueries from '@/components/SavedQueries'
import ExportData from '@/components/ExportData'

export default function Home() {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const triggerRefresh = () => {
    setRefreshCounter((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Weather Search and Display */}
          <div className="lg:col-span-2 space-y-6">
            <WeatherSearch
              setWeatherData={setWeatherData}
              setForecastData={setForecastData}
              triggerRefresh={triggerRefresh}
            />

            {weatherData && <WeatherDisplay weatherData={weatherData} />}

            {forecastData && <ForecastDisplay forecastData={forecastData} />}
          </div>

          {/* Right Column - Saved Queries and Export */}
          <div className="space-y-6">
            <ExportData />
            <SavedQueries refreshCounter={refreshCounter} />
          </div>
        </div>
      </div>
    </main>
  )
}
