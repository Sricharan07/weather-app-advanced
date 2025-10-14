'use client'

import { FileJson, FileSpreadsheet, FileCode } from 'lucide-react'

export default function ExportData() {
  const handleExport = async (format: 'json' | 'csv' | 'xml') => {
    try {
      const response = await fetch(`/api/export?format=${format}`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `weather-queries.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Export Data</h2>
      <p className="text-sm text-gray-600 mb-4">
        Download all saved weather queries in your preferred format
      </p>

      <div className="flex flex-col gap-2">
        <button
          onClick={() => handleExport('json')}
          className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2 transition-colors"
        >
          <FileJson size={18} />
          Export as JSON
        </button>

        <button
          onClick={() => handleExport('csv')}
          className="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 transition-colors"
        >
          <FileSpreadsheet size={18} />
          Export as CSV
        </button>

        <button
          onClick={() => handleExport('xml')}
          className="w-full px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center justify-center gap-2 transition-colors"
        >
          <FileCode size={18} />
          Export as XML
        </button>
      </div>
    </div>
  )
}
