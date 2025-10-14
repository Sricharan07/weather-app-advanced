import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'

    const queries = await prisma.weatherQuery.findMany({
      orderBy: { createdAt: 'desc' },
    })

    switch (format.toLowerCase()) {
      case 'json':
        return NextResponse.json(queries, {
          headers: {
            'Content-Disposition': 'attachment; filename="weather-queries.json"',
          },
        })

      case 'csv':
        const csvHeaders = [
          'ID',
          'Location',
          'Country',
          'Start Date',
          'End Date',
          'Temperature',
          'Humidity',
          'Wind Speed',
          'Description',
          'Forecast Days',
          'Created At',
        ]

        const csvRows = queries.map((q) => {
          const forecastData = q.forecastData as any
          const forecastSummary = forecastData?.forecast
            ? `${forecastData.forecast.length} days`
            : 'N/A'
          
          return [
            q.id,
            q.location,
            q.country || '',
            formatDate(q.startDate),
            formatDate(q.endDate),
            q.temperature?.toString() || '',
            q.humidity?.toString() || '',
            q.windSpeed?.toString() || '',
            q.description || '',
            forecastSummary,
            formatDate(q.createdAt),
          ]
        })

        const csvContent = [
          csvHeaders.join(','),
          ...csvRows.map((row) =>
            row.map((cell) => `"${cell}"`).join(',')
          ),
        ].join('\n')

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="weather-queries.csv"',
          },
        })

      case 'xml':
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<weatherQueries>
${queries
  .map(
    (q) => {
      const forecastData = q.forecastData as any
      const forecastXML = forecastData?.forecast
        ? `
    <forecast>
${forecastData.forecast
  .map(
    (day: any) => `      <day>
        <date>${day.date}</date>
        <tempMin>${day.tempMin}</tempMin>
        <tempMax>${day.tempMax}</tempMax>
        <description>${day.description}</description>
        <humidity>${day.humidity}</humidity>
        <windSpeed>${day.windSpeed}</windSpeed>
        <icon>${day.icon}</icon>
      </day>`
  )
  .join('\n')}
    </forecast>`
        : ''
      
      return `  <query>
    <id>${q.id}</id>
    <location>${q.location}</location>
    <country>${q.country || ''}</country>
    <startDate>${q.startDate.toISOString()}</startDate>
    <endDate>${q.endDate.toISOString()}</endDate>
    <temperature>${q.temperature || ''}</temperature>
    <feelsLike>${q.feelsLike || ''}</feelsLike>
    <tempMin>${q.tempMin || ''}</tempMin>
    <tempMax>${q.tempMax || ''}</tempMax>
    <humidity>${q.humidity || ''}</humidity>
    <pressure>${q.pressure || ''}</pressure>
    <windSpeed>${q.windSpeed || ''}</windSpeed>
    <clouds>${q.clouds || ''}</clouds>
    <description>${q.description || ''}</description>
    <icon>${q.icon || ''}</icon>${forecastXML}
    <createdAt>${q.createdAt.toISOString()}</createdAt>
    <updatedAt>${q.updatedAt.toISOString()}</updatedAt>
  </query>`
    }
  )
  .join('\n')}
</weatherQueries>`

        return new NextResponse(xmlContent, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': 'attachment; filename="weather-queries.xml"',
          },
        })

      default:
        return NextResponse.json(
          { error: 'Invalid format. Use json, csv, or xml' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'Failed to export weather queries' },
      { status: 500 }
    )
  }
}
