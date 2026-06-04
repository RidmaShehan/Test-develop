import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

function fileToDataUrl(file: File, buffer: Buffer): string {
  return `data:${file.type};base64,${buffer.toString('base64')}`
}

async function assertCanModifyTemplate(userId: string, role: string, templateUserId: string) {
  if (isAdminRole(role)) return true
  return templateUserId === userId
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params

    const existing = await prisma.whatsAppTemplate.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }

    if (!(await assertCanModifyTemplate(user.id, user.role, existing.userId))) {
      return NextResponse.json({ error: 'You do not have permission to edit this template.' }, { status: 403 })
    }

    const formData = await request.formData()
    const name = (formData.get('name') as string | null)?.trim() || ''
    const content = (formData.get('content') as string | null) || ''
    const mediaFile = formData.get('media') as File | null
    const clearImage = formData.get('clearImage') === 'true'

    if (!name) {
      return NextResponse.json({ error: 'Template name is required.' }, { status: 400 })
    }
    if (!content.trim()) {
      return NextResponse.json({ error: 'Template content is required.' }, { status: 400 })
    }

    if (mediaFile && mediaFile.size > 0 && !mediaFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files (e.g. JPEG, PNG, GIF) are supported for template images.' },
        { status: 400 }
      )
    }

    let mediaUpdate:
      | {
          mediaType: string | null
          mediaFilename: string | null
          mediaFilePath: null
          mediaBase64: string | null
          mediaSize: number | null
        }
      | undefined

    if (clearImage) {
      mediaUpdate = {
        mediaType: null,
        mediaFilename: null,
        mediaFilePath: null,
        mediaBase64: null,
        mediaSize: null,
      }
    } else if (mediaFile && mediaFile.size > 0) {
      const bytes = await mediaFile.arrayBuffer()
      const buffer = Buffer.from(bytes)
      mediaUpdate = {
        mediaType: mediaFile.type,
        mediaFilename: mediaFile.name,
        mediaFilePath: null,
        mediaBase64: fileToDataUrl(mediaFile, buffer),
        mediaSize: mediaFile.size,
      }
    }

    // Renaming: unique per user — if name changes, ensure no conflict with another row
    const nameConflict = await prisma.whatsAppTemplate.findFirst({
      where: {
        userId: existing.userId,
        name,
        NOT: { id },
      },
      select: { id: true },
    })
    if (nameConflict) {
      return NextResponse.json(
        { error: 'You already have another template with this name. Choose a different name.' },
        { status: 400 }
      )
    }

    const template = await prisma.whatsAppTemplate.update({
      where: { id },
      data: {
        name,
        content,
        ...(mediaUpdate ?? {}),
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
    console.error('Error updating WhatsApp template:', error)
    return NextResponse.json({ error: 'Could not update template. Please try again.' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth(request)
    const { id } = await context.params

    const existing = await prisma.whatsAppTemplate.findUnique({
      where: { id },
      select: { id: true, userId: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Template not found.' }, { status: 404 })
    }

    if (!(await assertCanModifyTemplate(user.id, user.role, existing.userId))) {
      return NextResponse.json({ error: 'You do not have permission to delete this template.' }, { status: 403 })
    }

    await prisma.whatsAppTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting WhatsApp template:', error)
    return NextResponse.json({ error: 'Could not delete template. Please try again.' }, { status: 500 })
  }
}
