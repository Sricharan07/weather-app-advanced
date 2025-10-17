'use client'

import { useState } from 'react'
import WeatherSidebar from '@/components/WeatherSidebar'
import WeatherMainPanel from '@/components/WeatherMainPanel'
import CityComparison from '@/components/CityComparison'
import SavedQueries from '@/components/SavedQueries'
import DeveloperInfo from '@/components/DeveloperInfo'

export default function Home() {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const triggerRefresh = () => {
    setRefreshCounter((prev) => prev + 1)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-800 via-slate-700 to-slate-600 relative overflow-hidden">
      {/* Weather background effect */}
      <div className="absolute inset-0 bg-[url('/weather-bg.jpg')] bg-cover bg-center opacity-20" />

      {/* Main content */}
      <div className="relative z-10 min-h-screen p-4 md:p-6 lg:p-8">
        <div className="max-w-[1920px] mx-auto">
          {/* Top section - Sidebar and Main Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-6">
            {/* Left Sidebar */}
            <div className="lg:col-span-3">
              <WeatherSidebar
                weatherData={weatherData}
                forecastData={forecastData}
                setWeatherData={setWeatherData}
                setForecastData={setForecastData}
                triggerRefresh={triggerRefresh}
              />
            </div>

            {/* Main Weather Panel */}
            <div className="lg:col-span-9">
              <WeatherMainPanel
                weatherData={weatherData}
                forecastData={forecastData}
              />
            </div>
          </div>

          {/* Bottom section - City Comparison */}
          <div className="mb-6">
            <CityComparison />
          </div>

          {/* Developer Info Footer */}
          <DeveloperInfo />

          {/* Saved Queries - Hidden in modal or separate view */}
          <div className="hidden">
            <SavedQueries refreshCounter={refreshCounter} />
          </div>
        </div>
      </div>
    </main>
  )
}
