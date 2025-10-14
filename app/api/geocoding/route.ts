import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Weather API key not configured' },
        { status: 500 }
      )
    }

    // Use OpenWeatherMap Geocoding API
    const url = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${apiKey}`

    const response = await axios.get(url)
    const data = response.data

    const suggestions = data.map((item: any) => ({
      name: item.name,
      state: item.state || '',
      country: item.country,
      lat: item.lat,
      lon: item.lon,
      displayName: `${item.name}${item.state ? ', ' + item.state : ''}, ${item.country}`,
    }))

    return NextResponse.json({ suggestions })
  } catch (error: any) {
    console.error('Geocoding API error:', error)
    return NextResponse.json({ suggestions: [] })
  }
}

