import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function validateDateRange(startDate: Date, endDate: Date): { valid: boolean; error?: string } {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const now = new Date()

  // Check if dates are valid
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Invalid date format" }
  }

  // Check if start is before end
  if (start >= end) {
    return { valid: false, error: "Start date must be before end date" }
  }

  // Check if dates are not too far in the future (max 1 year)
  const oneYearFromNow = new Date()
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)

  if (end > oneYearFromNow) {
    return { valid: false, error: "End date cannot be more than 1 year in the future" }
  }

  return { valid: true }
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function kelvinToCelsius(kelvin: number): number {
  return Math.round((kelvin - 273.15) * 10) / 10
}
