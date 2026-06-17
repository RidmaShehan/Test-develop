import { NextRequest, NextResponse } from 'next/server'
import { handleApiError } from '@/lib/handle-api-error'
import { requirePermission } from '@/lib/authorization'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('READ_SEEKER', req)
    const { id } = await params

    const notes = await prisma.voiceNote.findMany({
      where: { seekerId: id },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: notes })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.name === 'ForbiddenError') return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission('UPDATE_SEEKER', req)
    const { id: seekerId } = await params

    const seeker = await prisma.seeker.findUnique({ where: { id: seekerId } })
    if (!seeker) return NextResponse.json({ error: 'Inquiry not found' }, { status: 404 })

    const formData = await req.formData()
    const file = formData.get('audio') as File | null
    const durationSec = parseInt((formData.get('durationSec') as string) || '0', 10)

    if (!file) return NextResponse.json({ error: 'No audio file provided' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const folder = `educrm/voice-notes/${seekerId}`
    const fileName = `voice_${Date.now()}`

    const uploaded = await uploadToCloudinary(buffer, {
      folder,
      fileName,
      resourceType: 'video', // Cloudinary uses 'video' for audio files
      tags: ['educrm', 'voice-note', seekerId],
    })

    const voiceNote = await prisma.voiceNote.create({
      data: {
        seekerId,
        uploadedById: user.id,
        cloudinaryId: uploaded.publicId,
        cloudinaryUrl: uploaded.secureUrl,
        durationSec,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    })

    return NextResponse.json({ success: true, data: voiceNote }, { status: 201 })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (err.name === 'ForbiddenError') return NextResponse.json({ error: err.message }, { status: 403 })
    return handleApiError(err)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission('UPDATE_SEEKER', req)
    const { id: seekerId } = await params
    const { searchParams } = new URL(req.url)
    const noteId = searchParams.get('noteId')

    if (!noteId) return NextResponse.json({ error: 'noteId required' }, { status: 400 })

    await prisma.voiceNote.delete({ where: { id: noteId, seekerId } })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    if (err.name === 'AuthenticationError') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return handleApiError(err)
  }
}
