'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

interface CityWeather {
  name: string
  temp: number
  high: number
  low: number
  color: string
  loading?: boolean
}

export default function CityComparison() {
  const [cities, setCities] = useState<CityWeather[]>([
    { name: 'New York', temp: 0, high: 0, low: 0, color: 'from-yellow-400 to-orange-500', loading: true },
    { name: 'London', temp: 0, high: 0, low: 0, color: 'from-orange-400 to-red-500', loading: true },
    { name: 'Tokyo', temp: 0, high: 0, low: 0, color: 'from-pink-400 to-purple-500', loading: true },
    { name: 'Paris', temp: 0, high: 0, low: 0, color: 'from-purple-400 to-pink-500', loading: true },
    { name: 'Sydney', temp: 0, high: 0, low: 0, color: 'from-blue-400 to-purple-500', loading: true },
    { name: 'Dubai', temp: 0, high: 0, low: 0, color: 'from-pink-400 to-red-500', loading: true },
    { name: 'Mumbai', temp: 0, high: 0, low: 0, color: 'from-green-400 to-teal-500', loading: true },
  ])

  useEffect(() => {
    const fetchCityWeather = async (cityName: string, index: number) => {
      try {
        const response = await axios.get(`/api/weather?location=${encodeURIComponent(cityName)}`)
        const data = response.data

        setCities(prev => {
          const newCities = [...prev]
          newCities[index] = {
            ...newCities[index],
            temp: Math.round(data.temperature),
            high: Math.round(data.tempMax),
            low: Math.round(data.tempMin),
            loading: false
          }
          return newCities
        })
      } catch (error) {
        console.error(`Failed to fetch weather for ${cityName}:`, error)
        setCities(prev => {
          const newCities = [...prev]
          newCities[index] = {
            ...newCities[index],
            loading: false
          }
          return newCities
        })
      }
    }

    // Fetch weather for all cities
    cities.forEach((city, index) => {
      fetchCityWeather(city.name, index)
    })
  }, []) // Only run once on mount

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cities.map((city, idx) => (
        <div key={idx} className="glass-card p-4 text-center hover:bg-white/10 transition-all cursor-pointer">
          {city.loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-pulse text-white/40 text-xs">Loading...</div>
            </div>
          ) : (
            <>
              <div className="text-white/60 text-xs mb-2">
                high {city.high}°C
              </div>
              <div className="text-white/60 text-xs mb-3">
                low {city.low}°C
              </div>
              <div className="text-5xl font-light text-white mb-3">
                {city.temp}°
              </div>
              <div className="text-white/80 text-sm font-medium mb-3">
                {city.name}
              </div>
              <div className={`h-1 rounded-full bg-gradient-to-r ${city.color}`} />
            </>
          )}
        </div>
      ))}
    </div>
  )
}
