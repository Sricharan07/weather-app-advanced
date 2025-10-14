import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateDateRange } from '@/lib/utils'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      location,
      locationLat,
      locationLon,
      country,
      startDate,
      endDate,
      temperature,
      feelsLike,
      tempMin,
      tempMax,
      description,
      humidity,
      pressure,
      clouds,
      windSpeed,
      icon,
      forecastData,
    } = body

    // Validate required fields
    if (!location || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Location, startDate, and endDate are required' },
        { status: 400 }
      )
    }

    // Validate date range
    const dateValidation = validateDateRange(new Date(startDate), new Date(endDate))
    if (!dateValidation.valid) {
      return NextResponse.json(
        { error: dateValidation.error },
        { status: 400 }
      )
    }

    // Create the weather query
    const weatherQuery = await prisma.weatherQuery.create({
      data: {
        location,
        locationLat,
        locationLon,
        country,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        temperature,
        feelsLike,
        tempMin,
        tempMax,
        description,
        humidity,
        pressure,
        clouds,
        windSpeed,
        icon,
        forecastData: forecastData || null,
      },
    })

    return NextResponse.json(weatherQuery, { status: 201 })
  } catch (error) {
    console.error('Create query error:', error)
    return NextResponse.json(
      { error: 'Failed to create weather query' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const location = searchParams.get('location')
    const limit = searchParams.get('limit')

    const where = location ? { location: { contains: location, mode: 'insensitive' as const } } : {}
    const take = limit ? parseInt(limit) : undefined

    const queries = await prisma.weatherQuery.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    })

    return NextResponse.json(queries)
  } catch (error) {
    console.error('Get queries error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather queries' },
      { status: 500 }
    )
  }
}
