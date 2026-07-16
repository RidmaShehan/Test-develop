import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { handleApiError } from '@/lib/handle-api-error'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUltraMsgConfig, normalizeWhatsAppPhone, sendUltraMsgText } from '@/lib/ultramsg'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request)
    const phone = request.nextUrl.searchParams.get('phone')
    const messages = await prisma.whatsAppInboxMessage.findMany({
      where: phone ? { phoneNumber: normalizeWhatsAppPhone(phone) } : undefined,
      include: { seeker: { select: { id: true, fullName: true, phone: true, email: true } } },
      orderBy: { receivedAt: 'desc' }, take: phone ? 200 : 100,
    })
    return NextResponse.json({ messages })
  } catch (error) { return handleApiError(error) }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const body = await request.json()
    const phoneNumber = typeof body.phoneNumber === 'string' ? normalizeWhatsAppPhone(body.phoneNumber) : ''
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (!phoneNumber || !message) return NextResponse.json({ error: 'phoneNumber and message are required.' }, { status: 400 })
    if (message.length > 4096) return NextResponse.json({ error: 'Messages are limited to 4096 characters.' }, { status: 400 })

    const config = await getUltraMsgConfig()
    if (!config.instanceId || !config.token) return NextResponse.json({ error: 'UltraMsg credentials are not configured.' }, { status: 503 })
    const result = await sendUltraMsgText(config.instanceId, config.token, `+${phoneNumber}`, message)
    const seeker = await prisma.seeker.findFirst({ where: { OR: [{ phone: { contains: phoneNumber } }, { whatsappNumber: { contains: phoneNumber } }] }, select: { id: true } })
    const saved = await prisma.whatsAppInboxMessage.create({
      data: { providerMessageId: result?.id || `outbound_${randomUUID()}`, instanceId: config.instanceId, phoneNumber, body: message, direction: 'OUTBOUND', messageType: 'chat', status: 'sent', sentById: user.id, receivedAt: new Date(), seekerId: seeker?.id },
    })
    return NextResponse.json(saved, { status: 201 })
  } catch (error) { return handleApiError(error) }
}
