import { isAdminRole } from '@/lib/auth'
import { getEffectivePermissionsForUser } from '@/lib/authorization'
import { isAdmin } from '@/lib/permissions'

/**
 * True when the user may list or open any inquiry (any `createdById`),
 * including rows created by coordinators or other staff.
 *
 * Matches:
 * - Legacy admin enum roles (ADMIN, ADMINISTRATOR, DEVELOPER)
 * - Permission-based "admin" in the app UI: CREATE_USER + DELETE_USER on effective permissions
 */
export async function canViewAllInquiries(userId: string, role: string): Promise<boolean> {
  if (isAdminRole(role)) return true
  const permissions = await getEffectivePermissionsForUser(userId)
  return isAdmin(permissions)
}
