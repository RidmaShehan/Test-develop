import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { validateImageFile } from '@/lib/file-type-validation'

// Note: This endpoint now returns a base64 data URL instead of writing to S3/local disk.
// Use client-side compression to keep payloads small.
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Enforce server-side file size limit (DoS prevention)
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.` },
        { status: 400 }
      )
    }

    // Validate by magic bytes (do not trust file.type)
    const detected = await validateImageFile(file)
    if (!detected) {
      return NextResponse.json(
        { error: 'File must be a valid image (JPEG, PNG, GIF, or WebP).' },
        { status: 400 }
      )
    }

    // Convert file to base64 data URL (no S3 / filesystem)
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const mimeType = detected.mime || file.type || 'application/octet-stream'
    const dataUrl = `data:${mimeType};base64,${base64}`

    return NextResponse.json({
      url: dataUrl,
      key: `inline:${detected.ext}`,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file. Please try again later.' },
      { status: 500 }
    )
  }
}
