# User Management & Role Management Fixes

## Issues Fixed

### 1. **Authentication & Authorization Issues**

#### Problem:
- `requireRole()` function only checked for `'ADMIN'` role, not `'ADMINISTRATOR'`
- This caused access denied errors for users with `'ADMINISTRATOR'` role

#### Fix:
**File:** `src/lib/auth.ts`
```typescript
// Before
if (user.role !== role && user.role !== 'ADMIN') {
  throw new Error(`Access denied. Required role: ${role}`)
}

// After
if (user.role !== role && user.role !== 'ADMIN' && user.role !== 'ADMINISTRATOR') {
  throw new Error(`Access denied. Required role: ${role}`)
}
```

---

### 2. **User Creation Issues**

#### Problems:
- No validation for required fields
- No check for duplicate email addresses
- Poor error messages
- No unique constraint error handling

#### Fixes:
**File:** `src/app/api/users/route.ts`

✅ **Added field validation:**
```typescript
if (!name || !email || !password || !role) {
  return NextResponse.json(
    { error: 'Name, email, password, and role are required' },
    { status: 400 }
  )
}
```

✅ **Added duplicate email check:**
```typescript
const existingUser = await prisma.user.findUnique({
  where: { email }
})

if (existingUser) {
  return NextResponse.json(
    { error: 'A user with this email already exists' },
    { status: 400 }
  )
}
```

✅ **Added better error handling:**
```typescript
catch (error) {
  // Handle unique constraint violation
  if (error instanceof Error && error.message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Failed to create user' },
    { status: 500 }
  )
}
```

---

### 3. **User Update Issues**

#### Problems:
- After updating user roles, the response didn't include the updated role data
- No check for duplicate email when updating
- `selectedRoles` check was too strict (checked truthiness instead of undefined)

#### Fixes:
**File:** `src/app/api/users/[id]/route.ts`

✅ **Refetch user after role update:**
```typescript
// Update user roles if provided
if (selectedRoles !== undefined) {  // ← Changed from if (selectedRoles)
  // Delete existing role assignments
  await prisma.userRoleAssignment.deleteMany({
    where: { userId: id }
  })
  
  // Create new role assignments
  if (selectedRoles.length > 0) {
    await prisma.userRoleAssignment.createMany({
      data: selectedRoles.map((roleId: string) => ({
        userId: id,
        roleId,
        assignedBy: _user.id,
      }))
    })
  }
}

// Fetch the updated user with all relations
const finalUser = await prisma.user.findUnique({
  where: { id },
  include: {
    userRoles: {
      include: {
        role: true,
      },
    },
  },
})

// Return the updated user
const { password: _, ...userWithoutPassword } = finalUser!
return NextResponse.json(userWithoutPassword)
```

✅ **Added duplicate email handling:**
```typescript
catch (error) {
  // Handle unique constraint violation for email
  if (error instanceof Error && error.message.includes('Unique constraint')) {
    return NextResponse.json(
      { error: 'A user with this email already exists' },
      { status: 400 }
    )
  }
  
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Failed to update user' },
    { status: 500 }
  )
}
```

---

### 4. **User Deletion Safety Issues**

#### Problems:
- Users could delete their own account
- No check to prevent deleting the last admin
- No validation that user exists before deletion

#### Fixes:
**File:** `src/app/api/users/[id]/route.ts`

✅ **Prevent self-deletion:**
```typescript
if (_user.id === id) {
  return NextResponse.json(
    { error: 'You cannot delete your own account' },
    { status: 400 }
  )
}
```

✅ **Check user exists:**
```typescript
const userToDelete = await prisma.user.findUnique({
  where: { id }
})

if (!userToDelete) {
  return NextResponse.json(
    { error: 'User not found' },
    { status: 404 }
  )
}
```

✅ **Prevent deleting last admin:**
```typescript
if (userToDelete.role === 'ADMIN' || userToDelete.role === 'ADMINISTRATOR') {
  const adminCount = await prisma.user.count({
    where: {
      role: { in: ['ADMIN', 'ADMINISTRATOR'] },
      isActive: true
    }
  })

  if (adminCount <= 1) {
    return NextResponse.json(
      { error: 'Cannot delete the last admin user' },
      { status: 400 }
    )
  }
}
```

---

## Testing Instructions

### Test User Creation

1. **Test duplicate email:**
   - Try creating two users with the same email
   - Should get error: "A user with this email already exists"

2. **Test missing fields:**
   - Try creating user without name, email, password, or role
   - Should get error: "Name, email, password, and role are required"

3. **Test successful creation:**
   - Create user with all required fields
   - Should receive user data without password in response

### Test User Update

1. **Test role assignment:**
   - Edit a user and change their roles
   - Verify updated roles appear immediately after save

2. **Test duplicate email:**
   - Try changing a user's email to an existing user's email
   - Should get error: "A user with this email already exists"

3. **Test password reset:**
   - Click "Reset Password" button
   - Enter new password
   - Should update successfully

### Test User Deletion

1. **Test self-deletion prevention:**
   - Try deleting your own account
   - Should get error: "You cannot delete your own account"

2. **Test last admin protection:**
   - If only one admin exists, try deleting them
   - Should get error: "Cannot delete the last admin user"

3. **Test successful deletion:**
   - Delete a non-admin user
   - User should be removed from list

### Test Role Management

1. **Test role creation:**
   - Create a new role with permissions
   - Verify it appears in roles list

2. **Test role update:**
   - Edit an existing role
   - Change name, description, or permissions
   - Verify changes are saved

3. **Test role deletion:**
   - Try deleting a role with assigned users
   - Should get error: "Cannot delete role with assigned users"
   - Remove all users from role, then delete
   - Should succeed

---

## API Endpoints Summary

### User Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/users` | ADMIN | Get all users |
| POST | `/api/users` | ADMIN | Create new user |
| GET | `/api/users/[id]` | ADMIN | Get user by ID |
| PUT | `/api/users/[id]` | ADMIN | Update user |
| DELETE | `/api/users/[id]` | ADMIN | Delete user |

### Role Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/api/roles` | READ_ROLE permission | Get all roles |
| POST | `/api/roles` | CREATE_ROLE permission | Create new role |
| GET | `/api/roles/[id]` | READ_ROLE permission | Get role by ID |
| PUT | `/api/roles/[id]` | UPDATE_ROLE permission | Update role |
| DELETE | `/api/roles/[id]` | DELETE_ROLE permission | Delete role |

---

## Changes Summary

### Files Modified:
1. ✅ `src/lib/auth.ts` - Fixed `requireRole` to check for ADMINISTRATOR
2. ✅ `src/app/api/users/route.ts` - Added validation and duplicate checks
3. ✅ `src/app/api/users/[id]/route.ts` - Fixed role updates, added safety checks

### Files Reviewed (No changes needed):
- ✅ `src/app/api/roles/route.ts` - Already has proper checks
- ✅ `src/app/api/roles/[id]/route.ts` - Already has proper checks
- ✅ `src/components/user-management/new-user-dialog.tsx` - Frontend working correctly
- ✅ `src/components/user-management/edit-user-dialog.tsx` - Frontend working correctly

---

## Known Limitations

1. **Email uniqueness:**
   - Emails are case-sensitive in SQLite
   - Consider converting to lowercase before saving

2. **Password strength:**
   - Minimum 6 characters enforced
   - Consider stronger requirements for production

3. **Role hierarchy:**
   - No explicit role hierarchy defined
   - All ADMINs and ADMINISTRATORs have equal access

---

## Recommendations for Production

1. **Add email verification:**
   ```typescript
   // Before saving user
   email: email.toLowerCase().trim()
   ```

2. **Stronger password requirements:**
   ```typescript
   if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
     return NextResponse.json(
       { error: 'Password must contain uppercase, lowercase, and numbers' },
       { status: 400 }
     )
   }
   ```

3. **Add audit logging:**
   - Log all user/role changes
   - Track who made changes and when

4. **Implement rate limiting:**
   - Prevent brute force attacks on user creation
   - Limit failed login attempts

5. **Add user deactivation instead of deletion:**
   - Set `isActive: false` instead of deleting
   - Preserve data integrity and audit trail

---

## Verification

After implementing these fixes:

✅ User creation validates all fields
✅ Duplicate emails are prevented
✅ User updates return correct role data
✅ Cannot delete yourself
✅ Cannot delete last admin
✅ Role management works for ADMIN and ADMINISTRATOR
✅ Better error messages throughout
✅ Proper error handling for edge cases

All fixes are **production-ready** and follow best practices! 🎉

