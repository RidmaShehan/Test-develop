import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUltraMsgConfig, normalizeWhatsAppPhone } from '@/lib/ultramsg'

function secretsMatch(received: string | null, expected: string | undefined) {
  if (!received || !expected) return false
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  const config = await getUltraMsgConfig()
  const secret = request.headers.get('x-webhook-secret') || request.nextUrl.searchParams.get('secret')
  if (!secretsMatch(secret, config.webhookSecret || process.env.ULTRAMSG_WEBHOOK_SECRET)) {
    return NextResponse.json({ error: 'Invalid webhook secret.' }, { status: 401 })
  }

  const payload = await request.json().catch(() => null)
  const data = payload?.data
  if (payload?.event_type !== 'message_received' || !data?.id || !data?.from || data.fromMe) {
    return NextResponse.json({ received: true })
  }

  const phoneNumber = normalizeWhatsAppPhone(String(data.from))
  if (!phoneNumber) return NextResponse.json({ error: 'Message sender is missing.' }, { status: 400 })

  const seeker = await prisma.seeker.findFirst({
    where: { OR: [{ phone: { contains: phoneNumber } }, { whatsappNumber: { contains: phoneNumber } }] },
    select: { id: true },
  })

  await prisma.whatsAppInboxMessage.upsert({
    where: { providerMessageId: String(data.id) },
    update: { status: data.ack ? String(data.ack) : undefined },
    create: {
      providerMessageId: String(data.id), instanceId: String(payload.instanceId || ''), phoneNumber,
      body: typeof data.body === 'string' ? data.body : null, direction: 'INBOUND', messageType: String(data.type || 'chat'),
      status: data.ack ? String(data.ack) : null, rawPayload: payload,
      receivedAt: data.time ? new Date(Number(data.time) * 1000) : new Date(), seekerId: seeker?.id,
    },
  })

  return NextResponse.json({ received: true })
}
