/**
 * API Response Helpers
 * Helper functions for API responses
 */

import { NextResponse } from 'next/server'

export function unauthorizedResponse() {
  return NextResponse.json(
    { message: 'Not authenticated' },
    { status: 401 }
  )
}

export function badRequestResponse(message: string) {
  return NextResponse.json(
    { message },
    { status: 400 }
  )
}

export function successResponse(data: any) {
  return NextResponse.json(data)
}

export function errorResponse() {
  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  )
}
