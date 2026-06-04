import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { register } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    // Check if self-registration is enabled
    const setting = await prisma.systemSettings.findUnique({
      where: { key: 'allow_self_register' },
    })

    // Default: disabled unless explicitly set to 'true'
    if (!setting || setting.value !== 'true') {
      return NextResponse.json(
        { error: 'Self-registration is not enabled. Contact an administrator.' },
        { status: 403 }
      )
    }

    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const user = await register({ name, email, password, role: 'VIEWER' })

    if (!user) {
      return NextResponse.json({ error: 'An account with that email already exists' }, { status: 409 })
    }

    return NextResponse.json({ success: true, message: 'Account created successfully' }, { status: 201 })
  } catch (err) {
    console.error('Register error:', err)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
