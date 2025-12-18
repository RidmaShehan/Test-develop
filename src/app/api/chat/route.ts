import { NextRequest, NextResponse } from 'next/server'
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from '@google/generative-ai'
import { requireAuth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  // Parse request body first (can only be read once)
  let requestBody: { message: string; history?: any[] }
  try {
    requestBody = await request.json()
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }

  const { message, history = [] } = requestBody

  // Keep this in outer scope so error handlers can reference it.
  let availableModels: string[] = []

  try {
    // Check for API key first
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey || apiKey.trim() === '') {
      return NextResponse.json(
        { error: 'Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables. See CHAT_SETUP.md for instructions.' },
        { status: 500 }
      )
    }

    // Require authentication
    const user = await requireAuth(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize Gemini with API key
    let genAI
    try {
      genAI = new GoogleGenerativeAI(apiKey)
    } catch (initError: any) {
      console.error('Failed to initialize GoogleGenerativeAI:', initError)
      return NextResponse.json(
        { error: `Failed to initialize Gemini AI: ${initError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    // First, try to list available models to see what's actually accessible
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
      if (response.ok) {
        const data = await response.json()
        if (data.models && Array.isArray(data.models)) {
          availableModels = data.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''))
          console.log('Available models:', availableModels)
        }
      }
    } catch (listError) {
      console.warn('Could not list available models:', listError)
      // Continue with default models if listing fails
    }

    // Safety settings
    const safetySettings: SafetySetting[] = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ]

    // Generation config
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }

    // Build conversation history
    const chatHistory = history.map((msg: { role: string; content: string }) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }))

    // Build list of models to try
    // If we got available models from the API, use those first, otherwise use defaults
    const defaultModels = [
      'gemini-1.5-flash-002',
      'gemini-1.5-flash-001',
      'gemini-1.5-pro-002',
      'gemini-1.5-pro-001',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro',
    ]
    
    // If we have available models, prioritize those, then add defaults as fallback
    const modelsToTry = availableModels.length > 0 
      ? [...availableModels, ...defaultModels.filter(m => !availableModels.includes(m))]
      : defaultModels

    let lastError: any = null

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          safetySettings,
        })

        const chat = model.startChat({
          history: chatHistory,
          generationConfig,
        })

        const result = await chat.sendMessage(message)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({
          message: text,
        })
      } catch (modelError: any) {
        lastError = modelError
        // If it's a 404, try next model
        if (modelError.message?.includes('404') || modelError.message?.includes('not found')) {
          console.log(`Model ${modelName} not available, trying next...`)
          continue
        }
        // If it's a different error, throw it
        throw modelError
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All models failed')
  } catch (error: any) {
    console.error('Chat API error:', error)
    
    // Extract error message from various error formats
    const errorMessage = error?.message || error?.toString() || ''
    const errorString = JSON.stringify(error).toLowerCase()
    
    // Handle API key errors (403, Forbidden, unregistered callers)
    if (
      errorMessage.includes('API_KEY') || 
      errorMessage.includes('403') || 
      errorMessage.includes('Forbidden') ||
      errorMessage.includes('unregistered callers') ||
      errorString.includes('403') ||
      errorString.includes('forbidden') ||
      errorString.includes('unregistered')
    ) {
      const apiKey = process.env.GEMINI_API_KEY
      let errorMsg = 'Gemini API key is missing or invalid.\n\n'
      
      if (!apiKey || apiKey.trim() === '') {
        errorMsg += '❌ GEMINI_API_KEY is not set in your environment variables.\n\n'
        errorMsg += 'Steps to fix:\n'
        errorMsg += '1. Create a .env file in the root directory (if it doesn\'t exist)\n'
        errorMsg += '2. Add: GEMINI_API_KEY=your-api-key-here\n'
        errorMsg += '3. Get your API key from: https://makersuite.google.com/app/apikey\n'
        errorMsg += '4. Restart your development server (npm run dev)'
      } else {
        errorMsg += '⚠️ API key is set but appears to be invalid or doesn\'t have proper permissions.\n\n'
        errorMsg += 'Please verify:\n'
        errorMsg += '1. The API key is correct (no extra spaces or quotes)\n'
        errorMsg += '2. The API key has Generative Language API enabled\n'
        errorMsg += '3. You\'ve restarted the server after adding the key\n'
        errorMsg += '4. See CHAT_SETUP.md for detailed instructions'
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      )
    }

    // Handle model not found errors (404) - provide helpful guidance
    if (errorMessage.includes('404') || errorMessage.includes('not found') || errorString.includes('404')) {
      const apiKey = process.env.GEMINI_API_KEY
      let errorMsg = `No available models found with your API key.\n\n`
      
      if (availableModels.length > 0) {
        errorMsg += `Available models detected: ${availableModels.join(', ')}\n`
        errorMsg += `But none of them worked. This might be a permissions issue.\n\n`
      } else {
        errorMsg += `Could not detect any available models. This usually means:\n\n`
        errorMsg += `1. ❌ "Generative Language API" is NOT enabled in Google Cloud Console\n`
        errorMsg += `2. ❌ Your API key doesn't have access to this API\n`
        errorMsg += `3. ❌ The API key is from a project without the API enabled\n\n`
        errorMsg += `📋 SOLUTION - Follow these steps:\n\n`
        errorMsg += `Step 1: Go to https://console.cloud.google.com\n`
        errorMsg += `Step 2: Select your project (where you created the API key)\n`
        errorMsg += `Step 3: Go to "APIs & Services" > "Library"\n`
        errorMsg += `Step 4: Search for "Generative Language API"\n`
        errorMsg += `Step 5: Click "Enable"\n`
        errorMsg += `Step 6: Wait 1-2 minutes, then restart your server\n\n`
        errorMsg += `💡 Quick Link: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com\n\n`
        errorMsg += `See ENABLE_GEMINI_API.md for detailed instructions with screenshots.\n\n`
      }
      
      errorMsg += `Error: ${errorMessage.substring(0, 300)}`
      
      return NextResponse.json(
        { error: errorMsg },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: errorMessage || 'Failed to get response from AI' },
      { status: 500 }
    )
  }
}

