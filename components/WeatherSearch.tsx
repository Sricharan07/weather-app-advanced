'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Calendar } from 'lucide-react'
import axios from 'axios'

interface WeatherSearchProps {
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

export default function WeatherSearch({
  setWeatherData,
  setForecastData,
  triggerRefresh,
}: WeatherSearchProps) {
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [locationStatus, setLocationStatus] = useState('')
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lon: number } | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Auto-load weather for current location on page load
  useEffect(() => {
    // Call geolocation on mount
    loadCurrentLocationOnMount()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadCurrentLocationOnMount = () => {
    setLoading(true)
    setError('')
    setLocationStatus('🌍 Retrieving your current location...')

    // Set default dates for auto-load on mount
    const today = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(today.getDate() + 7)
    const defaultStartDate = today.toISOString().split('T')[0]
    const defaultEndDate = oneWeekLater.toISOString().split('T')[0]
    setStartDate(defaultStartDate)
    setEndDate(defaultEndDate)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLocationStatus('')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocationStatus(`📍 Found location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setLocation(`${latitude},${longitude}`)
        // Pass dates directly to handleSearch to avoid state update timing issues
        await handleSearch(`${latitude},${longitude}`, undefined, defaultStartDate, defaultEndDate)
        setLocationStatus('')
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter a location manually.')
        setLocationStatus('')
        setLoading(false)
      }
    )
  }

  // Fetch city suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (location.trim().length < 2) {
        setSuggestions([])
        setShowSuggestions(false)
        return
      }

      // Don't fetch suggestions if location is coordinates
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const setDefaultDates = () => {
    const today = new Date()
    const oneWeekLater = new Date()
    oneWeekLater.setDate(today.getDate() + 7)

    setStartDate(today.toISOString().split('T')[0])
    setEndDate(oneWeekLater.toISOString().split('T')[0])
  }

  const useMyLocation = () => {
    setLoading(true)
    setError('')
    setLocationStatus('🌍 Retrieving your current location...')

    // Auto-set default dates if not already set
    if (!startDate || !endDate) {
      setDefaultDates()
    }

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setLocationStatus('')
      setLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        setLocationStatus(`📍 Found location: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`)
        setLocation(`${latitude},${longitude}`)
        await handleSearch(`${latitude},${longitude}`)
        setLocationStatus('')
      },
      (error) => {
        setError('Unable to retrieve your location. Please enter a location manually.')
        setLocationStatus('')
        setLoading(false)
      }
    )
  }

  const handleSuggestionClick = (suggestion: CitySuggestion) => {
    setLocation(suggestion.displayName)
    setSelectedCoords({ lat: suggestion.lat, lon: suggestion.lon })
    setShowSuggestions(false)
    // Automatically trigger search when a suggestion is selected
    setTimeout(() => handleSearch(suggestion.displayName, { lat: suggestion.lat, lon: suggestion.lon }), 100)
  }

  const handleSearch = async (
    searchLocation?: string,
    coords?: { lat: number; lon: number },
    dateStart?: string,
    dateEnd?: string
  ) => {
    const loc = searchLocation || location
    if (!loc.trim()) {
      setError('Please enter a location')
      setLoading(false)
      return
    }

    // Use provided dates or fall back to state
    const searchStartDate = dateStart || startDate
    const searchEndDate = dateEnd || endDate

    // Validate date range requirement per PDF
    if (!searchStartDate || !searchEndDate) {
      setError('Please select start and end dates. Both location and date range are required.')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    setShowSuggestions(false)

    try {
      let weatherUrl = '/api/weather?'
      let forecastUrl = '/api/weather/forecast?'
      let dateRangeUrl = '/api/weather/date-range?'

      // Use selected coordinates if available
      if (coords || selectedCoords) {
        const { lat, lon } = coords || selectedCoords!
        weatherUrl += `lat=${lat}&lon=${lon}`
        forecastUrl += `lat=${lat}&lon=${lon}`
        dateRangeUrl += `lat=${lat}&lon=${lon}`
        setSelectedCoords(null) // Reset after use
      } else {
        // Check if location is coordinates (lat,lon)
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

      // Add date range to the URL
      dateRangeUrl += `&startDate=${searchStartDate}&endDate=${searchEndDate}`

      // Fetch weather, forecast, and date range data
      const [weatherResponse, forecastResponse, dateRangeResponse] = await Promise.all([
        axios.get(weatherUrl),
        axios.get(forecastUrl),
        axios.get(dateRangeUrl),
      ])

      setWeatherData(weatherResponse.data)
      setForecastData(forecastResponse.data)

      // Save to database - REQUIRED per PDF (location + date range + daily weather data)
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
        setError('Weather retrieved but failed to save to database. Please try again.')
      }

      setError('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch weather data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Search Weather</h2>

      <div className="space-y-4">
        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (City, Zip Code, or Coordinates)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 relative" ref={dropdownRef}>
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
                placeholder="e.g., Tempe, London, 10001, or 51.5074,-0.1278"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch()
                  }
                }}
              />
              
              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {suggestion.displayName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Lat: {suggestion.lat.toFixed(4)}, Lon: {suggestion.lon.toFixed(4)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={useMyLocation}
              disabled={loading}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 flex items-center gap-2 transition-colors"
            >
              <MapPin size={18} />
              My Location
            </button>
          </div>
        </div>

        {/* Date Range - REQUIRED per PDF */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date Range <span className="text-red-500">*</span> <span className="text-xs text-gray-500">(Required for database storage)</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={setDefaultDates}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 transition-colors"
          >
            <Calendar size={18} />
            Set Dates (Today + 7 days)
          </button>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="flex-1 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center gap-2 transition-colors font-semibold"
          >
            <Search size={18} />
            {loading ? 'Searching...' : 'Search Weather'}
          </button>
        </div>

        {/* Location Status Message */}
        {locationStatus && (
          <div className="p-3 bg-blue-100 border border-blue-300 text-blue-700 rounded-lg">
            {locationStatus}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Info Message */}
        <p className="text-sm text-gray-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <strong>⚠️ Required:</strong> Both location and date range must be provided to search weather and save to database per technical assessment requirements.
        </p>
      </div>
    </div>
  )
}
