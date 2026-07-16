import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getProjectUserRole, canManageProject, canManageMembers, canAssignTasks } from '../lib/project-permissions'
import { prisma } from '../lib/prisma'

vi.mock('../lib/prisma', () => ({
  prisma: {
    projectMember: {
      findUnique: vi.fn(),
    },
    project: {
      findUnique: vi.fn(),
    },
  },
}))

describe('Project Permission Helper Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getProjectUserRole', () => {
    it('returns OWNER for global administrators', async () => {
      const role = await getProjectUserRole('proj-123', 'user-456', 'ADMIN')
      expect(role).toBe('OWNER')
    })

    it('returns role from database member records', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
        id: 'member-1',
        projectId: 'proj-123',
        userId: 'user-456',
        role: 'MANAGER',
        joinedAt: new Date()
      } as any)

      const role = await getProjectUserRole('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(role).toBe('MANAGER')
    })

    it('returns OWNER if user is the project creator (creator fallback)', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'proj-123',
        createdById: 'user-456',
      } as any)

      const role = await getProjectUserRole('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(role).toBe('OWNER')
    })

    it('returns null if user has no associations with the project', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue(null)
      vi.mocked(prisma.project.findUnique).mockResolvedValue({
        id: 'proj-123',
        createdById: 'creator-999',
      } as any)

      const role = await getProjectUserRole('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(role).toBeNull()
    })
  })

  describe('canManageProject', () => {
    it('allows OWNER', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
        role: 'OWNER',
      } as any)
      const allowed = await canManageProject('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(allowed).toBe(true)
    })

    it('denies MANAGER/CONTRIBUTOR/VIEWER', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
        role: 'MANAGER',
      } as any)
      const allowed = await canManageProject('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(allowed).toBe(false)
    })
  })

  describe('canManageMembers', () => {
    it('allows OWNER and MANAGER', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
        role: 'MANAGER',
      } as any)
      const allowed = await canManageMembers('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(allowed).toBe(true)
    })

    it('denies CONTRIBUTOR and VIEWER', async () => {
      vi.mocked(prisma.projectMember.findUnique).mockResolvedValue({
        role: 'CONTRIBUTOR',
      } as any)
      const allowed = await canManageMembers('proj-123', 'user-456', 'CONTRIBUTOR')
      expect(allowed).toBe(false)
    })
  })
})
