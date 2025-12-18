import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Media storage configuration
const MEDIA_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'campaigns')

async function saveMediaFileLocally(file: File): Promise<{ filePath: string; fileName: string }> {
  try {
    // Ensure upload directory exists
    await mkdir(MEDIA_UPLOAD_DIR, { recursive: true })
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || 'jpg'
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const filePath = join(MEDIA_UPLOAD_DIR, uniqueFileName)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    return {
      filePath: `/uploads/campaigns/${uniqueFileName}`,
      fileName: uniqueFileName
    }
  } catch (error) {
    console.error('Error saving media file locally:', error)
    throw new Error('Failed to save media file locally')
  }
}

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
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'File must be an image' },
        { status: 400 }
      )
    }
    
    // Note: File size validation is handled on the frontend with compression
    // We accept any size here since compression happens before upload
    
    // Try S3 first, fallback to local storage
    let result: { filePath: string; fileName: string; s3Key?: string }
    
    try {
      // Try S3 first
      const s3Result = await uploadToS3(file, 'campaigns')
      result = {
        filePath: s3Result.filePath,
        fileName: s3Result.fileName,
        s3Key: s3Result.s3Key
      }
      console.log('File uploaded to S3:', result)
    } catch (s3Error) {
      console.warn('S3 upload failed, falling back to local storage:', s3Error)
      try {
        // Fallback to local storage
        const localResult = await saveMediaFileLocally(file)
        result = {
          filePath: localResult.filePath,
          fileName: localResult.fileName
        }
        console.log('File saved locally:', result)
      } catch (localError) {
        console.error('Both S3 and local storage failed:', { s3Error, localError })
        const errorMessage = s3Error instanceof Error ? s3Error.message : 'Unknown S3 error'
        const localErrorMessage = localError instanceof Error ? localError.message : 'Unknown local storage error'
        return NextResponse.json(
          { 
            error: 'Failed to upload file',
            details: `S3 error: ${errorMessage}. Local storage error: ${localErrorMessage}`,
            suggestion: 'Please check your AWS S3 configuration or ensure the uploads directory is writable.'
          },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json({
      url: result.filePath,
      key: result.s3Key || result.fileName,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to upload file',
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
