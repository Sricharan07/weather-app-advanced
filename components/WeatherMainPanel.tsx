'use client'

import { useState, useEffect } from 'react'
import { Cloud, CloudRain, CloudSnow, Sun, Wind } from 'lucide-react'

interface WeatherMainPanelProps {
  weatherData: any
  forecastData: any
}

export default function WeatherMainPanel({ weatherData, forecastData }: WeatherMainPanelProps) {
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    // Set time only on client side to avoid hydration errors
    setCurrentTime(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }))
  }, [weatherData])
  const getWeatherIcon = (description: string) => {
    const desc = description?.toLowerCase() || ''
    if (desc.includes('rain')) return <CloudRain size={48} className="text-white" />
    if (desc.includes('snow')) return <CloudSnow size={48} className="text-white" />
    if (desc.includes('cloud')) return <Cloud size={48} className="text-white" />
    return <Sun size={48} className="text-white" />
  }

  // Get next 7 days of forecast including today
  const forecastDays = forecastData?.forecast?.slice(0, 7) || []

  // Get hourly forecast for the graph (next 24 hours)
  const hourlyData = forecastData?.hourlyForecast || []

  // Generate temperature curve path based on hourly data
  const generateCurvePath = () => {
    if (hourlyData.length === 0) {
      return "M 0,50 Q 166,30 333,40 T 666,50 T 1000,70"
    }

    const numHours = hourlyData.length
    const width = 1000
    const height = 100
    const segmentWidth = width / (numHours - 1)

    // Find min and max temps for scaling
    const temps = hourlyData.map((hour: any) => hour.temp)
    const minTemp = Math.min(...temps)
    const maxTemp = Math.max(...temps)
    const tempRange = maxTemp - minTemp || 1

    // Generate path points
    const points = hourlyData.map((hour: any, idx: number) => {
      const x = idx * segmentWidth
      // Invert Y (lower temp = higher y value)
      const y = height - ((hour.temp - minTemp) / tempRange) * (height * 0.6) - (height * 0.2)
      return { x, y }
    })

    // Create smooth curve using quadratic bezier curves
    let path = `M ${points[0].x},${points[0].y}`
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i]
      const next = points[i + 1]
      const controlX = (current.x + next.x) / 2
      const controlY = (current.y + next.y) / 2
      path += ` Q ${controlX},${current.y} ${next.x},${next.y}`
    }

    return path
  }

  return (
    <div className="glass-card-large h-full min-h-[600px] p-8 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-20 w-64 h-64 bg-blue-300 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="text-white/80 text-lg font-medium">
              {weatherData?.location || 'Weather'}
            </div>
            {weatherData?.country && (
              <div className="text-white/60 text-sm">{weatherData.country}</div>
            )}
          </div>
        </div>

        {/* Main Weather Display */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-white/60 text-sm mb-4">Weather Forecast</div>
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-light text-white mb-4">
            {weatherData?.description
              ? weatherData.description.split(' ').map((word: string, i: number) => (
                  <span key={i}>
                    {word.charAt(0).toUpperCase() + word.slice(1)}
                    {i === 0 && <br />}
                    {i > 0 && ' '}
                  </span>
                ))
              : 'Storm with Heavy Rain'}
          </h1>

          {/* Location and Time */}
          <div className="flex items-center gap-2 text-white/80 mb-6">
            <Cloud size={16} />
            <span className="text-sm">
              {weatherData?.location || 'USA'}{currentTime && `, ${currentTime}`}
            </span>
          </div>

          {/* Detailed Description */}
          <div className="max-w-2xl">
            <p className="text-white/70 text-sm leading-relaxed">
              {weatherData
                ? `Current conditions: ${weatherData.description}. Temperature ${Math.round(weatherData.temperature)}°C, feels like ${Math.round(weatherData.feelsLike)}°C. Wind speed ${weatherData.windSpeed} m/s. Humidity at ${weatherData.humidity}%. Cloud coverage ${weatherData.clouds}%.`
                : 'Variable clouds with snow showers. High 11F. Winds E at 10 to 20 mph. Chance of snow 50%. Snow accumulations less than one inch.'}
            </p>
          </div>

          {/* Current Temperature with High/Low */}
          <div className="mt-8 flex items-center gap-6">
            <div className="inline-flex items-baseline glass-card px-6 py-3">
              <span className="text-5xl font-light text-white">
                {weatherData ? Math.round(weatherData.temperature) : '17'}
              </span>
              <span className="text-3xl font-light text-white/70">°</span>
            </div>
            {weatherData && (
              <div className="text-white/60">
                <div className="text-sm">High: <span className="text-white font-medium">{Math.round(weatherData.tempMax)}°C</span></div>
                <div className="text-sm">Low: <span className="text-white font-medium">{Math.round(weatherData.tempMin)}°C</span></div>
              </div>
            )}
          </div>

        </div>

        {/* Forecast Timeline */}
        <div className="mt-auto pt-8">
          {/* Temperature curve */}
          {hourlyData.length > 0 && (
            <div className="relative h-40 mb-4">
              <svg className="w-full h-full" viewBox="0 0 1000 100" preserveAspectRatio="none">
                {/* Smooth curve through forecast temperatures */}
                <path
                  d={generateCurvePath()}
                  fill="none"
                  stroke="rgba(251,191,36,0.6)"
                  strokeWidth="3"
                />

                {/* Hourly markers on the curve */}
                {hourlyData.map((hour: any, idx: number) => {
                  const numHours = hourlyData.length
                  const width = 1000
                  const height = 100
                  const segmentWidth = width / (numHours - 1)
                  const x = idx * segmentWidth

                  // Calculate y position for the hour's temperature
                  const temps = hourlyData.map((h: any) => h.temp)
                  const minTemp = Math.min(...temps)
                  const maxTemp = Math.max(...temps)
                  const tempRange = maxTemp - minTemp || 1

                  const y = height - ((hour.temp - minTemp) / tempRange) * (height * 0.6) - (height * 0.2)

                  return (
                    <g key={idx}>
                      {/* Point on curve */}
                      <circle cx={x} cy={y} r="4" fill="rgba(251,191,36,1)" />
                    </g>
                  )
                })}
              </svg>

              {/* High temperatures above curve */}
              <div className="absolute top-0 left-0 right-0 flex justify-between px-4">
                {hourlyData.map((hour: any, idx: number) => (
                  <div key={idx} className="text-center" style={{ width: `${100 / hourlyData.length}%` }}>
                    <div className="text-orange-300 text-xs font-medium mb-1">
                      {Math.round(hour.tempMax)}°
                    </div>
                  </div>
                ))}
              </div>

              {/* Low temperatures below curve */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4">
                {hourlyData.map((hour: any, idx: number) => (
                  <div key={idx} className="text-center" style={{ width: `${100 / hourlyData.length}%` }}>
                    <div className="text-blue-300 text-xs font-medium">
                      {Math.round(hour.tempMin)}°
                    </div>
                  </div>
                ))}
              </div>

              {/* Hourly time labels at the very bottom */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-4">
                {hourlyData.map((hour: any, idx: number) => {
                  return (
                    <div key={idx} className="text-center" style={{ width: `${100 / hourlyData.length}%` }}>
                      <div className="text-white/50 text-xs">
                        {hour.time}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Forecast cards - Next 7 days */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-12">
            {forecastDays.map((day: any, idx: number) => {
              const date = new Date(day.date)
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
              const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

              return (
                <div key={idx} className="glass-card p-4 text-center">
                  <div className="text-white/60 text-xs mb-2">
                    {idx === 0 ? 'Today' : dayName}
                  </div>
                  <div className="text-white/60 text-xs mb-2">
                    {monthDay}
                  </div>
                  <div className="text-white/60 text-xs mb-2">
                    high {Math.round(day.tempMax)}°C
                  </div>
                  <div className="text-white/60 text-xs mb-3">
                    low {Math.round(day.tempMin)}°C
                  </div>
                  <div className="text-4xl font-light text-white mb-2">
                    {Math.round((day.tempMax + day.tempMin) / 2)}°
                  </div>
                  <div className="text-white/80 text-xs capitalize mb-1 truncate">
                    {day.description}
                  </div>
                  <div className="mt-2">
                    <div className={`h-1 rounded-full bg-gradient-to-r ${
                      idx % 7 === 0 ? 'from-yellow-400 to-orange-500' :
                      idx % 7 === 1 ? 'from-orange-400 to-red-500' :
                      idx % 7 === 2 ? 'from-pink-400 to-purple-500' :
                      idx % 7 === 3 ? 'from-purple-400 to-pink-500' :
                      idx % 7 === 4 ? 'from-blue-400 to-purple-500' :
                      idx % 7 === 5 ? 'from-pink-400 to-red-500' :
                      'from-green-400 to-teal-500'
                    }`} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
