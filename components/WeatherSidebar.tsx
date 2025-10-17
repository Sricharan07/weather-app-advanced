'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Thermometer, X, Calendar, Download, FileJson, FileSpreadsheet, FileCode, History } from 'lucide-react'
import axios from 'axios'
import { formatDate } from '@/lib/utils'

interface WeatherSidebarProps {
  weatherData: any
  forecastData: any
  setWeatherData: (data: any) => void
  setForecastData: (data: any) => void
  triggerRefresh: () => void
}

interface CitySuggestion {
  name: string
  state: string
  country: string
  lat: number
  lon: number
  displayName: string
}

interface WeatherQuery {
  id: string
  location: string
  country?: string
  startDate: string
  endDate: string
  temperature?: number
  humidity?: number
  description?: string
  createdAt: string
}

export default function WeatherSidebar({
  weatherData,
  forecastData,
  setWeatherData,
  setForecastData,
  triggerRefresh,
}: WeatherSidebarProps) {
  const [showSearch, setShowSearch] = useState(false)
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [savedQueries, setSavedQueries] = useState<WeatherQuery[]>([])
  const [showQueries, setShowQueries] = useState(false)

  // Fetch saved queries when search is opened
  useEffect(() => {
    const fetchQueries = async () => {
      if (showSearch) {
        try {
          const response = await axios.get('/api/queries?limit=5')
          setSavedQueries(response.data)
        } catch (error) {
          console.error('Failed to fetch queries:', error)
        }
      }
    }
    fetchQueries()
  }, [showSearch])

  // Fetch city suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (location.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      const coordMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
      if (coordMatch) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      try {
        const response = await axios.get(`/api/geocoding?q=${encodeURIComponent(location)}`)
        setSuggestions(response.data.suggestions || [])
        setShowSuggestions(response.data.suggestions?.length > 0)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
        setSuggestions([])
        setShowSuggestions(false)
      }
    }

    const debounceTimer = setTimeout(fetchSuggestions, 300)
    return () => clearTimeout(debounceTimer)
  }, [location])

  const setDefaultDates = () => {
    const today = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(today.getDate() + 7)
    setStartDate(today.toISOString().split('T')[0])
    setEndDate(oneWeekLater.toISOString().split('T')[0])
  }

  const handleDownload = async (queryId: string, format: 'json' | 'csv' | 'xml') => {
    try {
      const response = await fetch(`/api/queries/${queryId}/download?format=${format}`)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weather-query-${queryId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Download failed:', error)
      setError('Failed to download query')
    }
  }

  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    setLocation(suggestion.displayName)
    setSelectedCoords({ lat: suggestion.lat, lon: suggestion.lon })
    setShowSuggestions(false)
    setTimeout(() => handleSearch(suggestion.displayName, { lat: suggestion.lat, lon: suggestion.lon }), 100)
  }

  const handleSearch = async (searchLocation?: string, coords?: { lat: number; lon: number }) => {
    const loc = searchLocation || location
    if (!loc.trim()) {
      setError('Please enter a location')
      return
    }

    if (!startDate || !endDate) {
      setError('Please select start and end dates')
      return
    }

    setLoading(true)
    setError('')
    setShowSuggestions(false)

    try {
      let weatherUrl = '/api/weather?'
      let forecastUrl = '/api/weather/forecast?'
      let dateRangeUrl = '/api/weather/date-range?'

      if (coords || selectedCoords) {
        const { lat, lon } = coords || selectedCoords!
        weatherUrl += `lat=${lat}&lon=${lon}`
        forecastUrl += `lat=${lat}&lon=${lon}`
        dateRangeUrl += `lat=${lat}&lon=${lon}`
        setSelectedCoords(null)
      } else {
        const coordMatch = loc.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
        if (coordMatch) {
          const [, lat, lon] = coordMatch
          weatherUrl += `lat=${lat}&lon=${lon}`
          forecastUrl += `lat=${lat}&lon=${lon}`
          dateRangeUrl += `lat=${lat}&lon=${lon}`
        } else {
          weatherUrl += `location=${encodeURIComponent(loc)}`
          forecastUrl += `location=${encodeURIComponent(loc)}`
          dateRangeUrl += `location=${encodeURIComponent(loc)}`
        }
      }

      dateRangeUrl += `&startDate=${startDate}&endDate=${endDate}`

      const [weatherResponse, forecastResponse, dateRangeResponse] = await Promise.all([
        axios.get(weatherUrl),
        axios.get(forecastUrl),
        axios.get(dateRangeUrl),
      ])

      setWeatherData(weatherResponse.data)
      setForecastData(forecastResponse.data)

      // Save to database
      try {
        await axios.post('/api/queries', {
          location: weatherResponse.data.location,
          locationLat: weatherResponse.data.coordinates.lat,
          locationLon: weatherResponse.data.coordinates.lon,
          country: weatherResponse.data.country,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          temperature: weatherResponse.data.temperature,
          feelsLike: weatherResponse.data.feelsLike,
          tempMin: weatherResponse.data.tempMin,
          tempMax: weatherResponse.data.tempMax,
          description: weatherResponse.data.description,
          humidity: weatherResponse.data.humidity,
          pressure: weatherResponse.data.pressure,
          clouds: weatherResponse.data.clouds,
          windSpeed: weatherResponse.data.windSpeed,
          icon: weatherResponse.data.icon,
          forecastData: forecastResponse.data,
          dailyWeatherData: dateRangeResponse.data,
        })
        triggerRefresh()
      } catch (dbError) {
        console.error('Failed to save to database:', dbError)
      }

      setError('')
      setShowSearch(false)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  const useMyLocation = () => {
    setLoading(true)
    setError('')

    // Set default dates if not already set
    const today = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(today.getDate() + 7)
    const defaultStartDate = today.toISOString().split('T')[0]
    const defaultEndDate = oneWeekLater.toISOString().split('T')[0]

    if (!startDate) setStartDate(defaultStartDate)
    if (!endDate) setEndDate(defaultEndDate)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocation(`${latitude.toFixed(4)},${longitude.toFixed(4)}`)

        // Call handleSearch with the location and dates
        const loc = `${latitude},${longitude}`
        const searchStartDate = startDate || defaultStartDate
        const searchEndDate = endDate || defaultEndDate

        try {
          let weatherUrl = `/api/weather?lat=${latitude}&lon=${longitude}`
          let forecastUrl = `/api/weather/forecast?lat=${latitude}&lon=${longitude}`
          let dateRangeUrl = `/api/weather/date-range?lat=${latitude}&lon=${longitude}&startDate=${searchStartDate}&endDate=${searchEndDate}`

          const [weatherResponse, forecastResponse, dateRangeResponse] = await Promise.all([
            axios.get(weatherUrl),
            axios.get(forecastUrl),
            axios.get(dateRangeUrl),
          ])

          setWeatherData(weatherResponse.data)
          setForecastData(forecastResponse.data)

          // Save to database
          try {
            await axios.post('/api/queries', {
              location: weatherResponse.data.location,
              locationLat: weatherResponse.data.coordinates.lat,
              locationLon: weatherResponse.data.coordinates.lon,
              country: weatherResponse.data.country,
              startDate: new Date(searchStartDate),
              endDate: new Date(searchEndDate),
              temperature: weatherResponse.data.temperature,
              feelsLike: weatherResponse.data.feelsLike,
              tempMin: weatherResponse.data.tempMin,
              tempMax: weatherResponse.data.tempMax,
              description: weatherResponse.data.description,
              humidity: weatherResponse.data.humidity,
              pressure: weatherResponse.data.pressure,
              clouds: weatherResponse.data.clouds,
              windSpeed: weatherResponse.data.windSpeed,
              icon: weatherResponse.data.icon,
              forecastData: forecastResponse.data,
              dailyWeatherData: dateRangeResponse.data,
            })
            triggerRefresh()
          } catch (dbError) {
            console.error('Failed to save to database:', dbError)
          }

          setError('')
          setShowSearch(false)
        } catch (err: any) {
          setError(err.response?.data?.error || 'Failed to fetch weather data')
        } finally {
          setLoading(false)
        }
      },
      (error) => {
        setError('Unable to retrieve your location')
        setLoading(false)
      }
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Search Box */}
      <div className="glass-card p-4">
        <div className="flex items-center gap-3">
          <Thermometer className="text-white/80" size={24} />
          <div className="flex-1">
            <button
              onClick={() => setShowSearch(!showSearch)}
              className="w-full bg-white/10 text-white text-left placeholder-white/60 px-4 py-2 rounded-lg border border-white/20 hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              {weatherData?.location || 'Search Location...'}
            </button>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {showSearch ? <X className="text-white/80" size={20} /> : <Search className="text-white/80" size={20} />}
          </button>
        </div>

        {/* Expanded Search Panel */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            showSearch ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="space-y-4">
            {/* Location Input */}
            <div className="relative">
              <label className="block text-xs font-medium text-white/70 mb-2">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  setSelectedCoords(null)
                }}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true)
                  }
                }}
                placeholder="City, zip code, or coordinates"
                className="w-full bg-white/10 text-white placeholder-white/40 px-4 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40"
              />

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 glass-card max-h-48 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-white/60 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-white">
                            {suggestion.displayName}
                          </p>
                          <p className="text-xs text-white/50">
                            Lat: {suggestion.lat.toFixed(4)}, Lon: {suggestion.lon.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-2">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-white/10 text-white px-3 py-2 rounded-lg border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={setDefaultDates}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition-all flex items-center justify-center gap-2"
              >
                <Calendar size={14} />
                Today + 7
              </button>
              <button
                onClick={useMyLocation}
                disabled={loading}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg border border-white/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <MapPin size={14} />
                My Location
              </button>
            </div>

            {/* Search Button */}
            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-500/80 hover:bg-blue-600/80 text-white rounded-lg transition-all disabled:opacity-50 font-medium"
            >
              {loading ? 'Searching...' : 'Search Weather'}
            </button>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-200 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Saved Queries Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <History size={16} className="text-white/60" />
                  <span className="text-sm font-medium text-white/80">Recent Searches</span>
                </div>
                <button
                  onClick={() => setShowQueries(!showQueries)}
                  className="text-xs text-white/60 hover:text-white/80 transition-colors"
                >
                  {showQueries ? 'Hide' : 'Show'}
                </button>
              </div>

              {showQueries && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {savedQueries.length === 0 ? (
                    <p className="text-white/40 text-xs text-center py-4">No recent searches</p>
                  ) : (
                    savedQueries.map((query) => (
                      <div
                        key={query.id}
                        className="glass-card p-3 hover:bg-white/15 transition-all"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="text-white text-sm font-medium">
                              {query.location}
                              {query.country && <span className="text-white/60">, {query.country}</span>}
                            </div>
                            <div className="text-white/50 text-xs mt-1">
                              {formatDate(query.startDate)} - {formatDate(query.endDate)}
                            </div>
                            {query.temperature && (
                              <div className="text-white/70 text-xs mt-1">
                                {Math.round(query.temperature)}°C • {query.description}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Download Options */}
                        <div className="flex gap-1 mt-2">
                          <button
                            onClick={() => handleDownload(query.id, 'json')}
                            className="flex-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                            title="Download JSON"
                          >
                            <FileJson size={12} />
                            JSON
                          </button>
                          <button
                            onClick={() => handleDownload(query.id, 'csv')}
                            className="flex-1 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                            title="Download CSV"
                          >
                            <FileSpreadsheet size={12} />
                            CSV
                          </button>
                          <button
                            onClick={() => handleDownload(query.id, 'xml')}
                            className="flex-1 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                            title="Download XML"
                          >
                            <FileCode size={12} />
                            XML
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Current Temperature */}
      <div className="glass-card p-6">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-baseline">
              <span className="text-7xl font-light text-white">
                {weatherData ? Math.round(weatherData.temperature) : '20'}
              </span>
              <span className="text-4xl font-light text-white/70">°</span>
              <span className="text-2xl font-light text-white/70 ml-1">C</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-white/60 text-sm">
              {weatherData ? `±${Math.abs(Math.round(weatherData.tempMax - weatherData.temperature))}` : '±3'}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-2 text-white/80">
          <div className="text-2xl font-light">
            {weatherData ? weatherData.humidity : '9.8'}%
          </div>
        </div>

        {/* Wind Speed */}
        <div className="mt-3 text-white/60 text-sm">
          Wind: {weatherData ? `${weatherData.windSpeed} m/s` : 'WSW 6 mph'}
        </div>

        {/* Safety Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white/60 text-sm">Safe</span>
            <span className="text-white/60 text-sm">Dangerous</span>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full ${
                  i <= 2
                    ? 'bg-green-500'
                    : i <= 4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
                style={{ opacity: i <= 1 ? 1 : 0.3 }}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-white/60">
            <div>• 0.00% - 0.9%</div>
            <div>• 0.9% - 11%</div>
          </div>
          <div className="text-right text-xs text-white/60">• 0.8%</div>
        </div>
      </div>


      {/* Air Quality */}
      <div className="glass-card p-4">
        <div className="text-white font-medium mb-2">
          {weatherData?.location || 'Oklahoma City'}
        </div>
        <p className="text-white/60 text-xs leading-relaxed">
          The air quality is generally acceptable for most individuals. However,
          sensitive groups may experience minor to moderate symptoms from
          long-term exposure.
        </p>
      </div>
    </div>
  )
}
