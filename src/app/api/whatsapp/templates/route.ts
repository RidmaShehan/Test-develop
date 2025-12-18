import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'
import { uploadToS3 } from '@/lib/s3'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'

const TEMPLATE_MEDIA_UPLOAD_DIR = join(process.cwd(), 'public', 'uploads', 'whatsapp-templates')

async function saveTemplateMediaLocally(file: File): Promise<{ filePath: string; fileName: string }> {
  try {
    await mkdir(TEMPLATE_MEDIA_UPLOAD_DIR, { recursive: true })
    const fileExtension = file.name.split('.').pop() || ''
    const uniqueFileName = `${randomUUID()}.${fileExtension}`
    const filePath = join(TEMPLATE_MEDIA_UPLOAD_DIR, uniqueFileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)
    return {
      filePath: `/uploads/whatsapp-templates/${uniqueFileName}`,
      fileName: uniqueFileName,
    }
  } catch (error) {
    console.error('Error saving template media locally:', error)
    throw new Error('Failed to save template media locally')
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)

    const where: any = {}
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own templates
    if (!isAdminRole(user.role)) {
      where.userId = user.id
    }

    const templates = await prisma.whatsAppTemplate.findMany({
      where,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        content: true,
        mediaType: true,
        mediaFilename: true,
        mediaFilePath: true,
        mediaSize: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const formData = await request.formData()

    const name = (formData.get('name') as string | null)?.trim() || ''
    const content = (formData.get('content') as string | null) || ''
    const mediaFile = formData.get('media') as File | null

    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    }
    if (!content.trim()) {
      return NextResponse.json({ error: 'Template content is required' }, { status: 400 })
    }

    if (mediaFile && !mediaFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are supported for templates' }, { status: 400 })
    }

    // Save media (try S3 first, fallback to local)
    let savedMediaFile: { filePath: string; fileName: string; s3Key?: string } | null = null
    if (mediaFile) {
      try {
        savedMediaFile = await uploadToS3(mediaFile, 'whatsapp-templates')
      } catch (s3Error) {
        console.warn('S3 upload failed for template media, falling back to local storage:', s3Error)
        savedMediaFile = await saveTemplateMediaLocally(mediaFile)
      }
    }

    // Create or update per-user by name
    const existing = await prisma.whatsAppTemplate.findUnique({
      where: {
        userId_name: {
          userId: user.id,
          name,
        },
      },
      select: { id: true },
    })

    const template = existing
      ? await prisma.whatsAppTemplate.update({
          where: { id: existing.id },
          data: {
            content,
            ...(savedMediaFile
              ? {
                  mediaType: mediaFile?.type,
                  mediaFilename: savedMediaFile.fileName || mediaFile?.name,
                  mediaFilePath: savedMediaFile.filePath,
                  mediaSize: mediaFile?.size,
                }
              : {}),
          },
          select: {
            id: true,
            name: true,
            content: true,
            mediaType: true,
            mediaFilename: true,
            mediaFilePath: true,
            mediaSize: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : await prisma.whatsAppTemplate.create({
          data: {
            userId: user.id,
            name,
            content,
            mediaType: mediaFile?.type,
            mediaFilename: savedMediaFile?.fileName || mediaFile?.name,
            mediaFilePath: savedMediaFile?.filePath,
            mediaSize: mediaFile?.size,
          },
          select: {
            id: true,
            name: true,
            content: true,
            mediaType: true,
            mediaFilename: true,
            mediaFilePath: true,
            mediaSize: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating WhatsApp template:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}


