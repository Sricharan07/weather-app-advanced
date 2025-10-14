'use client'

import { useEffect, useState } from 'react'
import { Edit2, Trash2, Save, X, Download, FileJson, FileSpreadsheet, FileCode } from 'lucide-react'
import axios from 'axios'
import { formatDate } from '@/lib/utils'

interface SavedQueriesProps {
  refreshCounter: number
}

interface WeatherQuery {
  id: string
  location: string
  country?: string
  startDate: string
  endDate: string
  temperature?: number
  humidity?: number
  windSpeed?: number
  description?: string
  forecastData?: {
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
  dailyWeatherData?: {
    location: string
    country: string
    startDate: string
    endDate: string
    dailyWeather: Array<{
      date: string
      temperature: number | null
      tempMin: number | null
      tempMax: number | null
      feelsLike: number | null
      description: string
      icon: string
      humidity: number | null
      pressure: number | null
      windSpeed: number | null
      clouds: number | null
      note?: string
    }>
    totalDays: number
  }
  createdAt: string
}

export default function SavedQueries({ refreshCounter }: SavedQueriesProps) {
  const [queries, setQueries] = useState<WeatherQuery[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<WeatherQuery>>({})

  const fetchQueries = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/queries')
      setQueries(response.data)
    } catch (error) {
      console.error('Failed to fetch queries:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQueries()
  }, [refreshCounter])

  const handleEdit = (query: WeatherQuery) => {
    setEditingId(query.id)
    setEditForm({
      location: query.location,
      startDate: query.startDate.split('T')[0],
      endDate: query.endDate.split('T')[0],
      temperature: query.temperature,
      humidity: query.humidity,
      windSpeed: query.windSpeed,
      description: query.description,
    })
  }

  const handleSave = async (id: string) => {
    try {
      await axios.put(`/api/queries/${id}`, editForm)
      setEditingId(null)
      fetchQueries()
    } catch (error) {
      console.error('Failed to update query:', error)
      alert('Failed to update query')
    }
  }

  const handleRefetch = async (id: string) => {
    if (!editForm.startDate || !editForm.endDate) {
      alert('Please set both start and end dates before refetching')
      return
    }

    try {
      await axios.post(`/api/queries/${id}/refetch`, {
        startDate: editForm.startDate,
        endDate: editForm.endDate,
      })
      setEditingId(null)
      fetchQueries()
      alert('Weather data refetched successfully!')
    } catch (error) {
      console.error('Failed to refetch weather data:', error)
      alert('Failed to refetch weather data')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this query?')) return

    try {
      await axios.delete(`/api/queries/${id}`)
      fetchQueries()
    } catch (error) {
      console.error('Failed to delete query:', error)
      alert('Failed to delete query')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditForm({})
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
      alert('Failed to download query')
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Saved Queries</h2>
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Saved Queries</h2>

      {queries.length === 0 ? (
        <p className="text-gray-600">No saved queries yet. Search for weather to save queries.</p>
      ) : (
        <div className="space-y-3 max-h-[600px] overflow-y-auto">
          {queries.map((query) => (
            <div
              key={query.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {editingId === query.id ? (
                // Edit Mode
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    placeholder="Location"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={editForm.startDate || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                    <input
                      type="date"
                      value={editForm.endDate || ''}
                      onChange={(e) =>
                        setEditForm({ ...editForm, endDate: e.target.value })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSave(query.id)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2"
                      >
                        <Save size={16} />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex-1 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center justify-center gap-2"
                      >
                        <X size={16} />
                        Cancel
                      </button>
                    </div>
                    {(editForm.startDate !== query.startDate.split('T')[0] ||
                      editForm.endDate !== query.endDate.split('T')[0]) && (
                      <button
                        onClick={() => handleRefetch(query.id)}
                        className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                      >
                        <Download size={16} />
                        Refetch Weather for New Dates
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                // View Mode
                <>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {query.location}
                        {query.country && `, ${query.country}`}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {formatDate(query.startDate)} - {formatDate(query.endDate)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(query)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(query.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {query.temperature && (
                      <div className="text-gray-600">
                        Temp: <span className="font-semibold">{Math.round(query.temperature)}°C</span>
                      </div>
                    )}
                    {query.humidity && (
                      <div className="text-gray-600">
                        Humidity: <span className="font-semibold">{query.humidity}%</span>
                      </div>
                    )}
                    {query.windSpeed && (
                      <div className="text-gray-600">
                        Wind: <span className="font-semibold">{query.windSpeed} m/s</span>
                      </div>
                    )}
                    {query.description && (
                      <div className="text-gray-600 col-span-2 capitalize">
                        {query.description}
                      </div>
                    )}
                  </div>

                  {/* Daily Weather Data Display */}
                  {query.dailyWeatherData?.dailyWeather && query.dailyWeatherData.dailyWeather.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        Daily Weather ({query.dailyWeatherData.totalDays} days):
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs max-h-48 overflow-y-auto">
                        {query.dailyWeatherData.dailyWeather.map((day, idx) => (
                          <div key={idx} className={`rounded p-2 ${day.temperature ? 'bg-green-50' : 'bg-gray-50'}`}>
                            <p className="font-semibold text-gray-800">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            {day.temperature ? (
                              <>
                                <p className="text-gray-600">
                                  {Math.round(day.tempMin || 0)}° - {Math.round(day.tempMax || 0)}°C
                                </p>
                                <p className="text-gray-500 capitalize truncate">
                                  {day.description}
                                </p>
                              </>
                            ) : (
                              <p className="text-gray-400 text-xs italic truncate">
                                {day.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Forecast Data Display */}
                  {query.forecastData?.forecast && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-700 mb-2">
                        {query.forecastData.forecast.length}-Day Forecast:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                        {query.forecastData.forecast.map((day, idx) => (
                          <div key={idx} className="bg-blue-50 rounded p-2">
                            <p className="font-semibold text-gray-800">
                              {new Date(day.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <p className="text-gray-600">
                              {Math.round(day.tempMin)}° - {Math.round(day.tempMax)}°C
                            </p>
                            <p className="text-gray-500 capitalize truncate">
                              {day.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Download Buttons */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                      <Download size={12} className="inline mr-1" />
                      Download this query:
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDownload(query.id, 'json')}
                        className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors text-xs flex items-center justify-center gap-1"
                        title="Download as JSON"
                      >
                        <FileJson size={12} />
                        JSON
                      </button>
                      <button
                        onClick={() => handleDownload(query.id, 'csv')}
                        className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors text-xs flex items-center justify-center gap-1"
                        title="Download as CSV"
                      >
                        <FileSpreadsheet size={12} />
                        CSV
                      </button>
                      <button
                        onClick={() => handleDownload(query.id, 'xml')}
                        className="flex-1 px-2 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors text-xs flex items-center justify-center gap-1"
                        title="Download as XML"
                      >
                        <FileCode size={12} />
                        XML
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    Saved: {formatDate(query.createdAt)}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
