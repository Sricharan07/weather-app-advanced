import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

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

    let url = 'https://api.openweathermap.org/data/2.5/weather?'

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

    const weatherData = {
      location: data.name,
      country: data.sys.country,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
      temperature: data.main.temp,
      feelsLike: data.main.feels_like,
      tempMin: data.main.temp_min,
      tempMax: data.main.temp_max,
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      windSpeed: data.wind.speed,
      clouds: data.clouds.all,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(weatherData)
  } catch (error: any) {
    if (error.response?.status === 404) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}
