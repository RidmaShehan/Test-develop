# Permission System Guide

## Overview

The CRM now uses a professional, centralized permission system with graceful UI degradation.

## Core Principles

- Logged-in users can always load pages
- Missing permissions show helpful messages instead of "Access Denied" screens
- UI visibility is controlled client-side (`canRead`, `PermissionGate`)
- Server-side enforcement remains strict for security

## How to Use

### 1. In Components / Pages

```tsx
import { usePermissions } from '@/hooks/use-permissions'
import { PermissionGate } from '@/hooks/use-permissions'

function MyComponent() {
  const { canCreate, canRead, canUpdate, canDelete } = usePermissions()

  return (
    <>
      <PermissionGate action="read" resource="SEEKER">
        <InquiriesTable />
      </PermissionGate>

      <PermissionGate action="create" resource="SEEKER">
        <NewInquiryButton />
      </PermissionGate>
    </>
  )
}
```

### 2. Available Helpers

- `canCreate(resource)` → `CREATE_XXX`
- `canRead(resource)` → `READ_XXX`
- `canUpdate(resource)` → `UPDATE_XXX`
- `canDelete(resource)` → `DELETE_XXX`
- `hasPermission(permission)`
- `hasAnyPermission([perms])`

### 3. Common Resources

- `SEEKER`, `CAMPAIGN`, `TASK`, `PROGRAM`, `USER`, `ROLE`, `REPORT`

### 4. Sidebar & Navigation

The sidebar automatically hides menu items based on permissions using the same system.

## Files Updated

- `src/contexts/auth-context.tsx` - Centralized auth
- `src/hooks/use-auth.ts` - Updated to use context
- `src/lib/permissions.ts` - Added CRUD helpers
- `src/hooks/use-permissions.ts` - Enhanced `PermissionGate`
- Multiple pages (`inquiries`, `campaigns`, `posts`, `weekly-reports`, etc.)

---

**For new features**: Add permission checks using `PermissionGate` or the `can*` helpers. Always keep server-side `requirePermission()` in API routes.

Last updated: March 2026
