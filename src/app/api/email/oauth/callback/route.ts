import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { exchangeGoogleCode, exchangeMicrosoftCode } from '@/lib/oauth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const provider = searchParams.get('provider')

    if (!code || !provider) {
      return NextResponse.json({ error: 'Missing code or provider' }, { status: 400 })
    }

    let accessToken = ''
    let refreshToken = ''
    let expiresIn = 3600
    let email = ''

    if (provider === 'google') {
      const exchanged = await exchangeGoogleCode(code)
      accessToken = exchanged.accessToken
      refreshToken = exchanged.refreshToken
      expiresIn = exchanged.expiresIn
      email = exchanged.email
    } else if (provider === 'microsoft') {
      const exchanged = await exchangeMicrosoftCode(code)
      accessToken = exchanged.accessToken
      refreshToken = exchanged.refreshToken
      expiresIn = exchanged.expiresIn
      email = exchanged.email
    } else {
      return NextResponse.json({ error: 'Invalid provider' }, { status: 400 })
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000)

    // Save the connection in the database linked to this user
    await prisma.emailAccount.upsert({
      where: { email },
      update: {
        accessToken,
        ...(refreshToken ? { refreshToken } : {}),
        expiresAt,
        provider: provider.toUpperCase(),
        userId: user.id
      },
      create: {
        userId: user.id,
        email,
        provider: provider.toUpperCase(),
        accessToken,
        refreshToken,
        expiresAt
      }
    })

    // Log user activity
    const { logUserActivity } = await import('@/lib/audit')
    await logUserActivity({
      userId: user.id,
      activityType: 'SYSTEM_ACCESS',
      metadata: { action: 'connect_email', provider: provider.toUpperCase(), email }
    })

    return NextResponse.redirect(new URL('/inbox?connected=true', request.url))
  } catch (error) {
    console.error('OAuth Callback Error:', error)
    return NextResponse.redirect(new URL(`/inbox?connected=false&error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth verification failed')}`, request.url))
  }
}
