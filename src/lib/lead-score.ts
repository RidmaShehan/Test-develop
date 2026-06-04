import { prisma } from '@/lib/prisma'

export interface LeadScoreBreakdown {
  recentInteraction: number
  interactionCount: number
  stageScore: number
  preferredStatus: number
  programAssigned: number
  contactCompleteness: number
  referralSource: number
}

const STAGE_POINTS: Record<string, number> = {
  NEW: 0,
  ATTEMPTING_CONTACT: 5,
  CONNECTED: 10,
  QUALIFIED: 15,
  COUNSELING_SCHEDULED: 18,
  CONSIDERING: 20,
  READY_TO_REGISTER: 20,
  LOST: 0,
}

export function getTier(score: number): 'HOT' | 'WARM' | 'COLD' {
  if (score >= 70) return 'HOT'
  if (score >= 40) return 'WARM'
  return 'COLD'
}

export async function calculateLeadScore(seekerId: string) {
  const seeker = await prisma.seeker.findUnique({
    where: { id: seekerId },
    include: {
      interactions: { orderBy: { createdAt: 'desc' }, take: 20 },
      programInterest: true,
    },
  })

  if (!seeker) throw new Error('Seeker not found')

  const breakdown: LeadScoreBreakdown = {
    recentInteraction: 0,
    interactionCount: 0,
    stageScore: 0,
    preferredStatus: 0,
    programAssigned: 0,
    contactCompleteness: 0,
    referralSource: 0,
  }

  // +20 if interaction in last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const recentInteraction = seeker.interactions.find((i) => new Date(i.createdAt) > sevenDaysAgo)
  if (recentInteraction) breakdown.recentInteraction = 20

  // +15 if 3+ interactions total
  if (seeker.interactions.length >= 3) breakdown.interactionCount = 15

  // +0–20 based on stage
  breakdown.stageScore = STAGE_POINTS[seeker.stage] || 0

  // +0–15 based on preferredStatus (1–10)
  if (seeker.preferredStatus) {
    breakdown.preferredStatus = Math.round((seeker.preferredStatus / 10) * 15)
  }

  // +10 if program assigned
  if (seeker.programInterestId || seeker.programInterest) breakdown.programAssigned = 10

  // +10 if both email and phone filled
  if (seeker.email && seeker.phone) breakdown.contactCompleteness = 10

  // +10 if referral source
  const referralSources = ['REFERRAL', 'PROMOTION_CODE', 'WORD_OF_MOUTH']
  if (referralSources.some((s) => seeker.marketingSource?.toUpperCase().includes(s))) {
    breakdown.referralSource = 10
  }

  const score = Math.min(
    100,
    Object.values(breakdown).reduce((a, b) => a + b, 0)
  )

  const tier = getTier(score)

  // Upsert into DB
  const leadScore = await prisma.leadScore.upsert({
    where: { seekerId },
    update: { score, breakdown: JSON.stringify(breakdown), tier },
    create: { seekerId, score, breakdown: JSON.stringify(breakdown), tier },
  })

  return { ...leadScore, breakdown }
}

export async function recalculateAllScores() {
  const seekers = await prisma.seeker.findMany({
    where: { isDeleted: false },
    select: { id: true },
  })

  const results = await Promise.allSettled(seekers.map((s) => calculateLeadScore(s.id)))
  const succeeded = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return { succeeded, failed, total: seekers.length }
}
