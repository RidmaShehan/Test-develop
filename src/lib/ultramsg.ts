import { prisma } from '@/lib/prisma'

export async function getUltraMsgConfig() {
  const settings = await prisma.systemSettings.findMany({
    where: { key: { in: ['whatsapp.instance_id', 'whatsapp.token', 'whatsapp.webhook_secret'] } },
  })
  const value = (key: string) => settings.find((setting) => setting.key === key)?.value
  return { instanceId: value('whatsapp.instance_id'), token: value('whatsapp.token'), webhookSecret: value('whatsapp.webhook_secret') }
}

export function normalizeWhatsAppPhone(value: string) {
  return value.replace(/@c\.us$/, '').replace(/\D/g, '')
}

export async function sendUltraMsgText(instanceId: string, token: string, to: string, body: string) {
  const response = await fetch(`https://api.ultramsg.com/${encodeURIComponent(instanceId)}/messages/chat?token=${encodeURIComponent(token)}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to, body }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || (payload && typeof payload === 'object' && 'error' in payload && payload.error)) {
    throw new Error('UltraMsg could not send this message.')
  }
  return payload as { id?: string; message?: string } | null
}
