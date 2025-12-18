import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json({
        status: 'error',
        message: 'GEMINI_API_KEY is not set in environment variables',
        apiKeySet: false,
      })
    }

    // Try to list available models
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      
      if (!response.ok) {
        const errorText = await response.text()
        return NextResponse.json({
          status: 'error',
          message: `API request failed: ${response.status} ${response.statusText}`,
          apiKeySet: true,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          error: errorText,
          suggestion: response.status === 403 
            ? 'API key may be invalid or Generative Language API is not enabled'
            : 'Check your API key and ensure Generative Language API is enabled'
        })
      }

      const data = await response.json()
      
      if (data.models && Array.isArray(data.models)) {
        const availableModels = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
          .map((m: any) => ({
            name: m.name.replace('models/', ''),
            displayName: m.displayName,
            supportedMethods: m.supportedGenerationMethods,
          }))

        return NextResponse.json({
          status: 'success',
          message: 'API is working correctly!',
          apiKeySet: true,
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          availableModels: availableModels,
          totalModels: availableModels.length,
        })
      }

      return NextResponse.json({
        status: 'warning',
        message: 'API responded but no models found',
        apiKeySet: true,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        response: data,
      })
    } catch (fetchError: any) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Gemini API',
        apiKeySet: true,
        apiKeyPrefix: apiKey.substring(0, 10) + '...',
        error: fetchError.message,
      })
    }
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        message: error.message || 'Unknown error',
      },
      { status: 500 }
    )
  }
}

