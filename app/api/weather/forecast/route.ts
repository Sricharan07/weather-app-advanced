import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      )
    }

    let url = 'https://api.openweathermap.org/data/2.5/forecast?'

    if (lat && lon) {
      url += `lat=${lat}&lon=${lon}`
    } else if (location) {
      url += `q=${encodeURIComponent(location)}`
    } else {
      return NextResponse.json(
        { error: 'Location or coordinates required' },
        { status: 400 }
      )
    }

    url += `&appid=${apiKey}&units=metric`

    const response = await axios.get(url)
    const data = response.data

    // Group forecast by day
    const forecastByDay: { [key: string]: any[] } = {}

    data.list.forEach((item: any) => {
      const date = format(new Date(item.dt * 1000), 'yyyy-MM-dd')
      if (!forecastByDay[date]) {
        forecastByDay[date] = []
      }
      forecastByDay[date].push(item)
    })

    // Get 7-day forecast with min/max temps (Note: OpenWeatherMap free tier provides 5 days of data)
    // We'll use all available days, typically 5 days
    const forecast = Object.keys(forecastByDay).slice(0, 7).map((date) => {
      const dayData = forecastByDay[date]
      const temps = dayData.map((item) => item.main.temp)
      const humidities = dayData.map((item) => item.main.humidity)
      const windSpeeds = dayData.map((item) => item.wind.speed)

      // Get the most common weather condition
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

    // Get next 24 hours of hourly data (8 timestamps - 3-hour intervals)
    const hourlyForecast = data.list.slice(0, 8).map((item: any) => {
      const timestamp = new Date(item.dt * 1000)
      return {
        time: timestamp.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        timestamp: item.dt,
        temp: item.main.temp,
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        windSpeed: item.wind.speed,
      }
    })

    return NextResponse.json({
      location: data.city.name,
      country: data.city.country,
      forecast,
      hourlyForecast,
    })
  } catch (error: any) {
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    console.error('Forecast API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch forecast data' },
      { status: 500 }
    )
  }
}
