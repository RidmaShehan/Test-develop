import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAuth, isAdminRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(request)
    
    // Build where clause based on user role
    const where: any = {}
    
    // If not ADMIN/ADMINISTRATOR/DEVELOPER, only show user's own messages
    if (!isAdminRole(user.role)) {
      where.userId = user.id
    }
    
    // Fetch WhatsApp message history with related data
    const messages = await prisma.whatsAppMessage.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        recipients: {
          include: {
            seeker: {
              select: {
                id: true,
                fullName: true,
                phone: true
              }
            }
          }
        }
      },
      orderBy: {
        sentAt: 'desc'
      }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching WhatsApp message history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch message history' },
      { status: 500 }
    )
  }
}
