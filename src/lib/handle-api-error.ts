import { NextResponse } from 'next/server'

/**
 * Shared utility to handle API errors securely.
 * - In production: returns a generic status 500 response.
 * - In development: returns error details and stack trace with status 500.
 * - Server-side: logs the full error with console.error.
 */
export function handleApiError(error: unknown) {
  // Always log the full error server-side
  console.error('❌ API Error:', error)

  const isProd = process.env.NODE_ENV === 'production'

  if (isProd) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }

  const message = error instanceof Error ? error.message : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined

  return NextResponse.json(
    {
      error: message,
      stack,
    },
    { status: 500 }
  )
}
