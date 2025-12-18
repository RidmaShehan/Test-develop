import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadToS3 } from '@/lib/s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

// Ultramsg API configuration
const ULTRAMSG_API_URL = 'https://api.ultramsg.com/instance104497'
const ULTRAMSG_TOKEN = '8yk46hlsn78dbubl'

// Media storage configuration
const MEDIA_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'whatsapp-media')

async function saveMediaFileLocally(file: File): Promise<{ filePath: string; fileName: string }> {
  try {
    // Ensure upload directory exists
    await mkdir(MEDIA_UPLOAD_DIR, { recursive: true })
    
    // Generate unique filename
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const filePath = join(MEDIA_UPLOAD_DIR, uniqueFileName)
    
    // Convert file to buffer and save
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    
    return {
      filePath: `/uploads/whatsapp-media/${uniqueFileName}`,
      fileName: uniqueFileName
    }
  } catch (error) {
    console.error('Error saving media file locally:', error)
    throw new Error('Failed to save media file locally')
  }
}

interface Seeker {
  id: string
  fullName: string
  phone: string
  whatsapp: boolean
  whatsappNumber?: string
  email?: string
  city?: string
  marketingSource: string
  campaignId?: string
}

// Removed unused interface

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Handle FormData for file uploads
    const formData = await request.formData()
    const seekersData = formData.get('seekers')
    const message = formData.get('message') as string
    const campaignId = (formData.get('campaignId') as string | null) || ''
    const mediaFile = formData.get('media') as File | null
    
    if (!seekersData) {
      return NextResponse.json(
        { error: 'No seekers provided' },
        { status: 400 }
      )
    }
    
    const seekers = JSON.parse(seekersData as string)

    if (!seekers || seekers.length === 0) {
      return NextResponse.json(
        { error: 'No seekers provided' },
        { status: 400 }
      )
    }

    if ((!message || message.trim().length === 0) && !mediaFile) {
      return NextResponse.json(
        { error: 'Message content or media file is required' },
        { status: 400 }
      )
    }

    // Save media file (try S3 first, fallback to local storage)
    let savedMediaFile: { filePath: string; fileName: string; s3Key?: string } | null = null
    if (mediaFile) {
      try {
        // Try S3 first
        savedMediaFile = await uploadToS3(mediaFile, 'whatsapp-media')
        console.log('Media file uploaded to S3:', savedMediaFile)
      } catch (s3Error) {
        console.warn('S3 upload failed, falling back to local storage:', s3Error)
        try {
          // Fallback to local storage
          savedMediaFile = await saveMediaFileLocally(mediaFile)
          console.log('Media file saved locally:', savedMediaFile)
        } catch (localError) {
          console.error('Both S3 and local storage failed:', { s3Error, localError })
          return NextResponse.json(
            { error: 'Failed to save media file. Please check your storage configuration.' },
            { status: 500 }
          )
        }
      }
    }

    const results = {
      sentCount: 0,
      failedCount: 0,
      errors: [] as string[]
    }

    const recipientLogs: Array<{
      seekerId: string
      phoneNumber: string
      status: 'SENT' | 'FAILED'
      errorMessage?: string
      sentAt?: Date
    }> = []

    // Pre-compute media payload once (mass-send uses the same attachment)
    let mediaBase64: string | null = null
    let endpoint = `${ULTRAMSG_API_URL}/messages/chat`
    let mediaField: 'image' | 'video' | 'audio' | 'document' | null = null
    if (mediaFile) {
      const mediaBuffer = await mediaFile.arrayBuffer()
      mediaBase64 = Buffer.from(mediaBuffer).toString('base64')
      if (mediaFile.type.startsWith('video/')) {
        endpoint = `${ULTRAMSG_API_URL}/messages/video`
        mediaField = 'video'
      } else if (mediaFile.type.startsWith('audio/')) {
        endpoint = `${ULTRAMSG_API_URL}/messages/audio`
        mediaField = 'audio'
      } else if (mediaFile.type === 'application/pdf') {
        endpoint = `${ULTRAMSG_API_URL}/messages/document`
        mediaField = 'document'
      } else {
        endpoint = `${ULTRAMSG_API_URL}/messages/image`
        mediaField = 'image'
      }
    }

    // Process each seeker
    for (const seeker of seekers) {
      try {
        // Skip non-WhatsApp inquiries (UI should filter, but backend must still guard)
        if (!seeker?.whatsapp) {
          results.failedCount++
          const errorMessage = 'This inquiry is not marked as WhatsApp-enabled'
          results.errors.push(`Failed to send to ${seeker.fullName}: ${errorMessage}`)
          recipientLogs.push({
            seekerId: seeker.id,
            phoneNumber: seeker.whatsappNumber || seeker.phone || '',
            status: 'FAILED',
            errorMessage,
          })
          continue
        }

        // Determine the phone number to use
        const phoneNumber = seeker.whatsappNumber || seeker.phone
        
        // Clean phone number (remove spaces, dashes, etc.)
        const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '')
        
        // Add country code if not present (assuming Sri Lanka +94)
        const formattedPhone = cleanPhone.startsWith('+') 
          ? cleanPhone 
          : cleanPhone.startsWith('94') 
            ? `+${cleanPhone}`
            : `+94${cleanPhone}`

        console.log('Processing seeker:', {
          name: seeker.fullName,
          originalPhone: phoneNumber,
          cleanPhone: cleanPhone,
          formattedPhone: formattedPhone,
          whatsapp: seeker.whatsapp
        })

        // Prepare request body based on whether media is included
        let requestBody: Record<string, any> = {
          to: formattedPhone,
          priority: 10,
          referenceId: `campaign_${campaignId || 'bulk'}_${seeker.id}`
        }

        if (mediaFile) {
          // For media messages, use different format
          requestBody = {
            ...requestBody,
            [mediaField as string]: mediaBase64, // Use appropriate field for media type
            caption: message && message.trim() ? message.trim() : 'Media message'
          }
        } else {
          // For text messages
          requestBody.body = message
        }

        // Send message via Ultramsg API
        console.log('Sending to Ultramsg API:', {
          url: endpoint,
          requestBody: requestBody
        })
        
        const response = await fetch(`${endpoint}?token=${ULTRAMSG_TOKEN}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        })

        const responseData = await response.json().catch(() => ({}))
        console.log('Ultramsg API response:', {
          status: response.status,
          statusText: response.statusText,
          data: responseData
        })
        
        // Log detailed error information if present
        if (responseData.error) {
          console.log('Ultramsg API error details:', JSON.stringify(responseData.error, null, 2))
        }

        // Check if the response is successful and doesn't contain errors
        if (response.ok && !responseData.error) {
          // Log the interaction in the database
          const interactionNotes = mediaFile 
            ? `Bulk WhatsApp message with media sent via campaign. Media: ${mediaFile.name}${message ? `, Message: "${message.substring(0, 50)}${message.length > 50 ? '...' : ''}"` : ''}`
            : `Bulk WhatsApp message sent via campaign. Message: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"`
            
          await prisma.interaction.create({
            data: {
              seekerId: seeker.id,
              userId: user.id,
              channel: 'WHATSAPP',
              outcome: 'CONNECTED_INTERESTED', // Default outcome for sent messages
              notes: interactionNotes
            }
          })

          results.sentCount++
          recipientLogs.push({
            seekerId: seeker.id,
            phoneNumber: formattedPhone,
            status: 'SENT',
            sentAt: new Date(),
          })
        } else {
          results.failedCount++
          const errorMessage = responseData.error 
            ? (Array.isArray(responseData.error) ? responseData.error[0]?.message || responseData.error[0] : responseData.error.message || responseData.error)
            : (responseData.message || 'Unknown error')
          results.errors.push(`Failed to send to ${seeker.fullName}: ${errorMessage}`)
          recipientLogs.push({
            seekerId: seeker.id,
            phoneNumber: formattedPhone,
            status: 'FAILED',
            errorMessage: String(errorMessage),
          })
        }
      } catch (error) {
        console.error(`Error sending message to ${seeker.fullName}:`, error)
        results.failedCount++
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Error sending to ${seeker.fullName}: ${errorMessage}`)
        recipientLogs.push({
          seekerId: seeker.id,
          phoneNumber: seeker?.whatsappNumber || seeker?.phone || '',
          status: 'FAILED',
          errorMessage,
        })
      }
    }

    // Create WhatsApp message history record
    const whatsappMessage = await prisma.whatsAppMessage.create({
      data: {
        message: message || (savedMediaFile ? `Media: ${savedMediaFile.fileName}` : 'Media message'),
        mediaType: mediaFile?.type,
        mediaFilename: savedMediaFile?.fileName || mediaFile?.name,
        mediaFilePath: savedMediaFile?.filePath,
        mediaSize: mediaFile?.size,
        recipientCount: seekers.length,
        sentCount: results.sentCount,
        failedCount: results.failedCount,
        sentAt: new Date(),
        userId: user.id,
        campaignId: campaignId || 'bulk',
        recipients: {
          create: recipientLogs.map((r) => ({
            seekerId: r.seekerId,
            phoneNumber: r.phoneNumber,
            status: r.status,
            errorMessage: r.errorMessage,
            sentAt: r.sentAt,
          }))
        }
      }
    })

    // Log the bulk send activity
    await prisma.userActivityLog.create({
      data: {
        userId: user.id,
        activityType: 'SYSTEM_ACCESS',
        metadata: {
          message: message,
          mediaFile: mediaFile ? {
            name: mediaFile.name,
            type: mediaFile.type,
            size: mediaFile.size
          } : null,
          totalSeekers: seekers.length,
          sentCount: results.sentCount,
          failedCount: results.failedCount,
          seekerIds: seekers.map((s: any) => s.id),
          campaignId: campaignId || 'bulk'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
        isSuccessful: results.failedCount === 0
      }
    })

    return NextResponse.json({
      success: true,
      sentCount: results.sentCount,
      failedCount: results.failedCount,
      totalSeekers: seekers.length,
      errors: results.errors
    })

  } catch (error) {
    console.error('Error in bulk WhatsApp send:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to send bulk WhatsApp messages' },
      { status: 500 }
    )
  }
}

// GET endpoint to check Ultramsg connection status
export async function GET(request: Request) {
  try {
    await requireAuth(request)
    
    // Test connection to Ultramsg API
    const response = await fetch(`${ULTRAMSG_API_URL}/status?token=${ULTRAMSG_TOKEN}`, {
      method: 'GET'
    })

    if (response.ok) {
      const status = await response.json()
      return NextResponse.json({
        connected: true,
        status: status
      })
    } else {
      return NextResponse.json({
        connected: false,
        error: 'Failed to connect to Ultramsg API'
      })
    }
  } catch (error) {
    console.error('Error checking Ultramsg connection:', error)
    return NextResponse.json({
      connected: false,
      error: 'Connection test failed'
    })
  }
}
