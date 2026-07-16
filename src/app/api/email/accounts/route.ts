import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth } from '@/lib/auth'
import { handleApiError } from '@/lib/handle-api-error'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const accounts = await prisma.emailAccount.findMany({
      where: { userId: user.id },
      select: { id: true, email: true, provider: true, createdAt: true }
    })
    return NextResponse.json(accounts)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing account id' }, { status: 400 })
    }

    await prisma.emailAccount.delete({
      where: { id, userId: user.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
