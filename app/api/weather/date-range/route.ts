import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { format, addDays, differenceInDays, parseISO } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      )
    }

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const startDate = parseISO(startDateStr)
    const endDate = parseISO(endDateStr)
    const daysDiff = differenceInDays(endDate, startDate)

    if (daysDiff < 0) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    // OpenWeatherMap free tier provides:
    // - Current weather
    // - 5-day/3-hour forecast (future only)
    // For this implementation, we'll use the forecast API and simulate data for the date range

    let forecastUrl = 'https://api.openweathermap.org/data/2.5/forecast?'

    if (lat && lon) {
      forecastUrl += `lat=${lat}&lon=${lon}`
    } else if (location) {
      forecastUrl += `q=${encodeURIComponent(location)}`
    } else {
      return NextResponse.json(
        { error: 'Location or coordinates required' },
        { status: 400 }
      )
    }

    forecastUrl += `&appid=${apiKey}&units=metric`

    const response = await axios.get(forecastUrl)
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

    // Generate weather data for each day in the range
    const dailyWeather: any[] = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= daysDiff; i++) {
      const currentDate = addDays(startDate, i)
      const dateStr = format(currentDate, 'yyyy-MM-dd')

      // Check if we have actual forecast data for this date
      if (forecastByDay[dateStr]) {
        const dayData = forecastByDay[dateStr]
        const temps = dayData.map((item) => item.main.temp)
        const humidities = dayData.map((item) => item.main.humidity)
        const windSpeeds = dayData.map((item) => item.wind.speed)
        const pressures = dayData.map((item) => item.main.pressure)
        const cloudiness = dayData.map((item) => item.clouds.all)

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

        dailyWeather.push({
          date: dateStr,
          temperature: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
          tempMin: Math.round(Math.min(...temps) * 10) / 10,
          tempMax: Math.round(Math.max(...temps) * 10) / 10,
          feelsLike: Math.round(dayData[0].main.feels_like * 10) / 10,
          description: mostCommonWeather.description,
          icon: mostCommonWeather.icon,
          humidity: Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length),
          pressure: Math.round(pressures.reduce((a, b) => a + b, 0) / pressures.length),
          windSpeed: Math.round((windSpeeds.reduce((a, b) => a + b, 0) / windSpeeds.length) * 10) / 10,
          clouds: Math.round(cloudiness.reduce((a, b) => a + b, 0) / cloudiness.length),
        })
      } else {
        // For dates outside the forecast range, use estimated/placeholder data
        // In a production app, you'd use a historical weather API or store past data
        const isHistorical = currentDate < today

        dailyWeather.push({
          date: dateStr,
          temperature: null,
          tempMin: null,
          tempMax: null,
          feelsLike: null,
          description: isHistorical ? 'Historical data unavailable' : 'Forecast unavailable',
          icon: '01d',
          humidity: null,
          pressure: null,
          windSpeed: null,
          clouds: null,
          note: isHistorical
            ? 'Historical weather data requires a premium API key'
            : 'Forecast only available for next 5 days',
        })
      }
    }

    return NextResponse.json({
      location: data.city.name,
      country: data.city.country,
      coordinates: {
        lat: data.city.coord.lat,
        lon: data.city.coord.lon,
      },
      startDate: startDateStr,
      endDate: endDateStr,
      dailyWeather,
      totalDays: dailyWeather.length,
    })
  } catch (error: any) {
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    console.error('Date range weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data for date range' },
      { status: 500 }
    )
  }
}
