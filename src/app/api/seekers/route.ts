import { NextRequest, NextResponse } from 'next/server'

// Redirect seekers API to inquiries API for backward compatibility
export async function GET(request: NextRequest) {
  // Forward the request to inquiries API
  const url = new URL('/api/inquiries', request.url)
  url.search = request.nextUrl.search
  
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: request.headers,
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}

export async function POST(request: NextRequest) {
  // Forward the request to inquiries API
  const url = new URL('/api/inquiries', request.url)
  
  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: request.headers,
    body: request.body,
  })
  
  const data = await response.json()
  return NextResponse.json(data, { status: response.status })
}
