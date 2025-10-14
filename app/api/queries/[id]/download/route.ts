import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'json'

    const query = await prisma.weatherQuery.findUnique({
      where: { id: params.id },
    })

    if (!query) {
      return NextResponse.json(
        { error: 'Weather query not found' },
        { status: 404 }
      )
    }

    const dailyWeatherData = query.dailyWeatherData as any
    const forecastData = query.forecastData as any

    switch (format.toLowerCase()) {
      case 'json':
        const jsonData = {
          id: query.id,
          location: query.location,
          country: query.country,
          coordinates: {
            lat: query.locationLat,
            lon: query.locationLon,
          },
          dateRange: {
            startDate: query.startDate,
            endDate: query.endDate,
          },
          currentWeather: {
            temperature: query.temperature,
            feelsLike: query.feelsLike,
            tempMin: query.tempMin,
            tempMax: query.tempMax,
            description: query.description,
            humidity: query.humidity,
            pressure: query.pressure,
            clouds: query.clouds,
            windSpeed: query.windSpeed,
            icon: query.icon,
          },
          dailyWeather: dailyWeatherData?.dailyWeather || [],
          forecast: forecastData?.forecast || [],
          metadata: {
            createdAt: query.createdAt,
            updatedAt: query.updatedAt,
          },
        }

        return NextResponse.json(jsonData, {
          headers: {
            'Content-Disposition': `attachment; filename="weather-query-${query.id}.json"`,
          },
        })

      case 'csv':
        let csvContent = ''

        // Header information
        csvContent += `Weather Query Report\n`
        csvContent += `Location,"${query.location}"\n`
        csvContent += `Country,"${query.country || 'N/A'}"\n`
        csvContent += `Date Range,"${formatDate(query.startDate)} to ${formatDate(query.endDate)}"\n`
        csvContent += `Coordinates,"${query.locationLat}, ${query.locationLon}"\n\n`

        // Current Weather
        csvContent += `Current Weather\n`
        csvContent += `Temperature,${query.temperature || 'N/A'}°C\n`
        csvContent += `Feels Like,${query.feelsLike || 'N/A'}°C\n`
        csvContent += `Min Temperature,${query.tempMin || 'N/A'}°C\n`
        csvContent += `Max Temperature,${query.tempMax || 'N/A'}°C\n`
        csvContent += `Description,"${query.description || 'N/A'}"\n`
        csvContent += `Humidity,${query.humidity || 'N/A'}%\n`
        csvContent += `Pressure,${query.pressure || 'N/A'} hPa\n`
        csvContent += `Wind Speed,${query.windSpeed || 'N/A'} m/s\n`
        csvContent += `Cloudiness,${query.clouds || 'N/A'}%\n\n`

        // Daily Weather Data
        if (dailyWeatherData?.dailyWeather && dailyWeatherData.dailyWeather.length > 0) {
          csvContent += `Daily Weather Data\n`
          csvContent += `Date,Temperature,Min Temp,Max Temp,Feels Like,Description,Humidity,Pressure,Wind Speed,Clouds\n`

          dailyWeatherData.dailyWeather.forEach((day: any) => {
            csvContent += `${day.date},${day.temperature || 'N/A'},${day.tempMin || 'N/A'},${day.tempMax || 'N/A'},${day.feelsLike || 'N/A'},"${day.description}",${day.humidity || 'N/A'},${day.pressure || 'N/A'},${day.windSpeed || 'N/A'},${day.clouds || 'N/A'}\n`
          })
          csvContent += `\n`
        }

        // Forecast Data
        if (forecastData?.forecast && forecastData.forecast.length > 0) {
          csvContent += `Forecast Data\n`
          csvContent += `Date,Min Temp,Max Temp,Description,Humidity,Wind Speed\n`

          forecastData.forecast.forEach((day: any) => {
            csvContent += `${day.date},${day.tempMin},${day.tempMax},"${day.description}",${day.humidity},${day.windSpeed}\n`
          })
        }

        return new NextResponse(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="weather-query-${query.id}.csv"`,
          },
        })

      case 'xml':
        let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n`
        xmlContent += `<weatherQuery>\n`
        xmlContent += `  <id>${query.id}</id>\n`
        xmlContent += `  <location>${query.location}</location>\n`
        xmlContent += `  <country>${query.country || ''}</country>\n`
        xmlContent += `  <coordinates>\n`
        xmlContent += `    <lat>${query.locationLat}</lat>\n`
        xmlContent += `    <lon>${query.locationLon}</lon>\n`
        xmlContent += `  </coordinates>\n`
        xmlContent += `  <dateRange>\n`
        xmlContent += `    <startDate>${query.startDate.toISOString()}</startDate>\n`
        xmlContent += `    <endDate>${query.endDate.toISOString()}</endDate>\n`
        xmlContent += `  </dateRange>\n`
        xmlContent += `  <currentWeather>\n`
        xmlContent += `    <temperature>${query.temperature || ''}</temperature>\n`
        xmlContent += `    <feelsLike>${query.feelsLike || ''}</feelsLike>\n`
        xmlContent += `    <tempMin>${query.tempMin || ''}</tempMin>\n`
        xmlContent += `    <tempMax>${query.tempMax || ''}</tempMax>\n`
        xmlContent += `    <description>${query.description || ''}</description>\n`
        xmlContent += `    <humidity>${query.humidity || ''}</humidity>\n`
        xmlContent += `    <pressure>${query.pressure || ''}</pressure>\n`
        xmlContent += `    <clouds>${query.clouds || ''}</clouds>\n`
        xmlContent += `    <windSpeed>${query.windSpeed || ''}</windSpeed>\n`
        xmlContent += `    <icon>${query.icon || ''}</icon>\n`
        xmlContent += `  </currentWeather>\n`

        // Daily Weather Data
        if (dailyWeatherData?.dailyWeather && dailyWeatherData.dailyWeather.length > 0) {
          xmlContent += `  <dailyWeather>\n`
          dailyWeatherData.dailyWeather.forEach((day: any) => {
            xmlContent += `    <day>\n`
            xmlContent += `      <date>${day.date}</date>\n`
            xmlContent += `      <temperature>${day.temperature || ''}</temperature>\n`
            xmlContent += `      <tempMin>${day.tempMin || ''}</tempMin>\n`
            xmlContent += `      <tempMax>${day.tempMax || ''}</tempMax>\n`
            xmlContent += `      <feelsLike>${day.feelsLike || ''}</feelsLike>\n`
            xmlContent += `      <description>${day.description}</description>\n`
            xmlContent += `      <humidity>${day.humidity || ''}</humidity>\n`
            xmlContent += `      <pressure>${day.pressure || ''}</pressure>\n`
            xmlContent += `      <windSpeed>${day.windSpeed || ''}</windSpeed>\n`
            xmlContent += `      <clouds>${day.clouds || ''}</clouds>\n`
            xmlContent += `      <icon>${day.icon}</icon>\n`
            if (day.note) {
              xmlContent += `      <note>${day.note}</note>\n`
            }
            xmlContent += `    </day>\n`
          })
          xmlContent += `  </dailyWeather>\n`
        }

        // Forecast Data
        if (forecastData?.forecast && forecastData.forecast.length > 0) {
          xmlContent += `  <forecast>\n`
          forecastData.forecast.forEach((day: any) => {
            xmlContent += `    <day>\n`
            xmlContent += `      <date>${day.date}</date>\n`
            xmlContent += `      <tempMin>${day.tempMin}</tempMin>\n`
            xmlContent += `      <tempMax>${day.tempMax}</tempMax>\n`
            xmlContent += `      <description>${day.description}</description>\n`
            xmlContent += `      <humidity>${day.humidity}</humidity>\n`
            xmlContent += `      <windSpeed>${day.windSpeed}</windSpeed>\n`
            xmlContent += `      <icon>${day.icon}</icon>\n`
            xmlContent += `    </day>\n`
          })
          xmlContent += `  </forecast>\n`
        }

        xmlContent += `  <metadata>\n`
        xmlContent += `    <createdAt>${query.createdAt.toISOString()}</createdAt>\n`
        xmlContent += `    <updatedAt>${query.updatedAt.toISOString()}</updatedAt>\n`
        xmlContent += `  </metadata>\n`
        xmlContent += `</weatherQuery>\n`

        return new NextResponse(xmlContent, {
          headers: {
            'Content-Type': 'application/xml',
            'Content-Disposition': `attachment; filename="weather-query-${query.id}.xml"`,
          },
        })

      default:
        return NextResponse.json(
          { error: 'Invalid format. Use json, csv, or xml' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Download query error:', error)
    return NextResponse.json(
      { error: 'Failed to download weather query' },
      { status: 500 }
    )
  }
}
