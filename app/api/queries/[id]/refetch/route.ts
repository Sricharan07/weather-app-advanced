import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateDateRange } from '@/lib/utils'
import axios from 'axios'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body

    // Check if query exists
    const existingQuery = await prisma.weatherQuery.findUnique({
      where: { id: params.id },
    })

    if (!existingQuery) {
      return NextResponse.json(
        { error: 'Weather query not found' },
        { status: 404 }
      )
    }

    // Validate date range
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const dateValidation = validateDateRange(new Date(startDate), new Date(endDate))
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      )
    }

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      )
    }

    // Build API URLs
    let weatherUrl = 'https://api.openweathermap.org/data/2.5/weather?'
    let forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?'

    if (existingQuery.locationLat && existingQuery.locationLon) {
      weatherUrl += `lat=${existingQuery.locationLat}&lon=${existingQuery.locationLon}`
      forecastUrl += `lat=${existingQuery.locationLat}&lon=${existingQuery.locationLon}`
    } else {
      weatherUrl += `q=${encodeURIComponent(existingQuery.location)}`
      forecastUrl += `q=${encodeURIComponent(existingQuery.location)}`
    }

    weatherUrl += `&appid=${apiKey}&units=metric`
    forecastUrl += `&appid=${apiKey}&units=metric`

    // Fetch weather, forecast, and date range data
    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
    ])

    const weatherData = weatherResponse.data
    const forecastData = forecastResponse.data

    // Process forecast data
    const forecastByDay: { [key: string]: any[] } = {}
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0]
      if (!forecastByDay[date]) {
        forecastByDay[date] = []
      }
      forecastByDay[date].push(item)
    })

    const forecast = Object.keys(forecastByDay).slice(0, 7).map((date) => {
      const dayData = forecastByDay[date]
      const temps = dayData.map((item) => item.main.temp)
      const humidities = dayData.map((item) => item.main.humidity)
      const windSpeeds = dayData.map((item) => item.wind.speed)

      const weatherCounts: { [key: string]: number } = {}
      let mostCommonWeather = dayData[0].weather[0]
      let maxCount = 0

      dayData.forEach((item) => {
        const desc = item.weather[0].description
        weatherCounts[desc] = (weatherCounts[desc] || 0) + 1
        if (weatherCounts[desc] > maxCount) {
          maxCount = weatherCounts[desc]
          mostCommonWeather = item.weather[0]
        }
      })

      return {
        date,
        tempMin: Math.min(...temps),
        tempMax: Math.max(...temps),
        description: mostCommonWeather.description,
        icon: mostCommonWeather.icon,
        humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
        windSpeed: Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10,
      }
    })

    // Fetch date range data
    const dateRangeUrl = `/api/weather/date-range?lat=${weatherData.coord.lat}&lon=${weatherData.coord.lon}&startDate=${startDate}&endDate=${endDate}`
    const dateRangeResponse = await axios.get(`${request.nextUrl.origin}${dateRangeUrl}`)

    // Update the query with new data
    const updatedQuery = await prisma.weatherQuery.update({
      where: { id: params.id },
      data: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        tempMin: weatherData.main.temp_min,
        tempMax: weatherData.main.temp_max,
        description: weatherData.weather[0].description,
        humidity: weatherData.main.humidity,
        pressure: weatherData.main.pressure,
        clouds: weatherData.clouds.all,
        windSpeed: weatherData.wind.speed,
        icon: weatherData.weather[0].icon,
        forecastData: {
          location: forecastData.city.name,
          country: forecastData.city.country,
          forecast,
        },
        dailyWeatherData: dateRangeResponse.data,
      },
    })

    return NextResponse.json(updatedQuery)
  } catch (error: any) {
    console.error('Refetch query error:', error)
    return NextResponse.json(
      { error: error.response?.data?.error || 'Failed to refetch weather data' },
      { status: 500 }
    )
  }
}
