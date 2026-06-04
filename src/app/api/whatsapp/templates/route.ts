import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

function fileToDataUrl(file: File, buffer: Buffer): string {
  return `data:${file.type};base64,${buffer.toString('base64')}`
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
        mediaBase64: true,
        mediaSize: true,
        userId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error('Error fetching WhatsApp templates:', error)
    return NextResponse.json({ error: 'Could not load templates. Please try again.' }, { status: 500 })
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
      return NextResponse.json({ error: 'Template name is required.' }, { status: 400 })
    }
    if (!content.trim()) {
      return NextResponse.json({ error: 'Template content is required.' }, { status: 400 })
    }

    if (mediaFile && !mediaFile.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files (e.g. JPEG, PNG, GIF) are supported for template images.' }, { status: 400 })
    }

    let mediaFields: {
      mediaType: string | undefined
      mediaFilename: string | undefined
      mediaFilePath: null
      mediaBase64: string
      mediaSize: number | undefined
    } | null = null

    if (mediaFile) {
      const bytes = await mediaFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      mediaFields = {
        mediaType: mediaFile.type,
        mediaFilename: mediaFile.name,
        mediaFilePath: null,
        mediaBase64: fileToDataUrl(mediaFile, buffer),
        mediaSize: mediaFile.size,
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
            ...(mediaFields
              ? mediaFields
              : {}),
          },
          select: {
            id: true,
            name: true,
            content: true,
            mediaType: true,
            mediaFilename: true,
            mediaFilePath: true,
            mediaBase64: true,
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
            ...(mediaFields ?? {}),
          },
          select: {
            id: true,
            name: true,
            content: true,
            mediaType: true,
            mediaFilename: true,
            mediaFilePath: true,
            mediaBase64: true,
            mediaSize: true,
            userId: true,
            createdAt: true,
            updatedAt: true,
          },
        })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error creating WhatsApp template:', error)
    return NextResponse.json({ error: 'Could not save template. Please try again.' }, { status: 500 })
  }
}
