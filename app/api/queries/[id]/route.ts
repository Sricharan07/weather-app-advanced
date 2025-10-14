import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateDateRange } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const query = await prisma.weatherQuery.findUnique({
      where: { id: params.id },
    })

    if (!query) {
      return NextResponse.json(
        { error: 'Weather query not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(query)
  } catch (error) {
    console.error('Get query error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather query' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

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

    // Validate date range if dates are being updated
    if (body.startDate || body.endDate) {
      const startDate = body.startDate ? new Date(body.startDate) : existingQuery.startDate
      const endDate = body.endDate ? new Date(body.endDate) : existingQuery.endDate

      const dateValidation = validateDateRange(startDate, endDate)
      if (!dateValidation.valid) {
        return NextResponse.json(
          { error: dateValidation.error },
          { status: 400 }
        )
      }
    }

    // Update the query - only update provided fields
    const updateData: any = {}

    if (body.location !== undefined) updateData.location = body.location
    if (body.locationLat !== undefined) updateData.locationLat = body.locationLat
    if (body.locationLon !== undefined) updateData.locationLon = body.locationLon
    if (body.country !== undefined) updateData.country = body.country
    if (body.startDate) updateData.startDate = new Date(body.startDate)
    if (body.endDate) updateData.endDate = new Date(body.endDate)
    if (body.temperature !== undefined) updateData.temperature = body.temperature
    if (body.feelsLike !== undefined) updateData.feelsLike = body.feelsLike
    if (body.tempMin !== undefined) updateData.tempMin = body.tempMin
    if (body.tempMax !== undefined) updateData.tempMax = body.tempMax
    if (body.description !== undefined) updateData.description = body.description
    if (body.humidity !== undefined) updateData.humidity = body.humidity
    if (body.pressure !== undefined) updateData.pressure = body.pressure
    if (body.clouds !== undefined) updateData.clouds = body.clouds
    if (body.windSpeed !== undefined) updateData.windSpeed = body.windSpeed
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.forecastData !== undefined) updateData.forecastData = body.forecastData
    if (body.dailyWeatherData !== undefined) updateData.dailyWeatherData = body.dailyWeatherData

    const updatedQuery = await prisma.weatherQuery.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(updatedQuery)
  } catch (error) {
    console.error('Update query error:', error)
    return NextResponse.json(
      { error: 'Failed to update weather query' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    await prisma.weatherQuery.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete query error:', error)
    return NextResponse.json(
      { error: 'Failed to delete weather query' },
      { status: 500 }
    )
  }
}
