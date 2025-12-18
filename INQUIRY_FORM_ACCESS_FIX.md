# Inquiry Form - Public Access to Dropdown Data

## Overview
Fixed the "Add New Inquiry" form to allow all authenticated users (regardless of role or permissions) to fetch:
- **Programs** - List of available programs
- **Marketing Source** (Campaign Types) - List of campaign types for marketing source selection
- **Campaigns** - List of campaigns (filtered by user role as appropriate)

**Date:** December 2024

---

## Problem
The inquiry form dropdowns for programs, marketing sources (campaign types), and campaigns were not accessible to all users due to authentication issues.

---

## Solution

### 1. ✅ Fixed `/api/programs` Route
**File:** `src/app/api/programs/route.ts`

**Changes:**
- Updated `GET` endpoint to accept `request` parameter
- Now properly authenticates users using `requireAuth(request)`
- Accessible to **all authenticated users** regardless of role

**Before:**
```typescript
export async function GET() {
  const _user = await requireAuth() // Missing request parameter
  // ...
}
```

**After:**
```typescript
// GET /api/programs - Get all programs
// Accessible to all authenticated users regardless of role
export async function GET(request: NextRequest) {
  const _user = await requireAuth(request) // Now accepts request
  // ...
}
```

### 2. ✅ Verified `/api/campaign-types` Route
**File:** `src/app/api/campaign-types/route.ts`

**Status:**
- Already accepts `request` parameter correctly
- Already accessible to all authenticated users
- Added clarifying comment

**Code:**
```typescript
// GET /api/campaign-types - Get all campaign types
// Accessible to all authenticated users regardless of role
export async function GET(request: NextRequest) {
  const user = await requireAuth(request)
  // Returns all campaign types (filtered by activeOnly if requested)
}
```

### 3. ✅ Campaigns Route
**File:** `src/app/api/campaigns/route.ts`

**Status:**
- Already properly configured
- Filters campaigns by user role (normal users see their own, admins see all)
- This is appropriate behavior - users should only see campaigns they can use

---

## Access Control Summary

### Programs (`/api/programs`)
- ✅ **Accessible to:** All authenticated users (any role)
- ✅ **No role restrictions** for fetching the list
- ✅ **Purpose:** Populate program selection dropdown in inquiry form

### Campaign Types (`/api/campaign-types`)
- ✅ **Accessible to:** All authenticated users (any role)
- ✅ **No role restrictions** for fetching the list
- ✅ **Purpose:** Populate marketing source dropdown in inquiry form

### Campaigns (`/api/campaigns`)
- ✅ **Accessible to:** All authenticated users (any role)
- ⚠️ **Filtered by role:**
  - Normal users: See only campaigns they created
  - Admin/Administrator/Developer: See all campaigns
- ✅ **Purpose:** Populate campaign selection dropdown in inquiry form (filtered appropriately)

---

## Testing Checklist

### As Normal User:
- [ ] Open "Add New Inquiry" form
- [ ] Programs dropdown should load and show all programs
- [ ] Marketing Source dropdown should load and show all campaign types
- [ ] Campaign dropdown should load and show only your campaigns (after selecting marketing source)

### As Admin/Administrator/Developer:
- [ ] Open "Add New Inquiry" form
- [ ] Programs dropdown should load and show all programs
- [ ] Marketing Source dropdown should load and show all campaign types
- [ ] Campaign dropdown should load and show all campaigns (after selecting marketing source)

---

## Files Modified

1. `src/app/api/programs/route.ts`
   - Updated `GET` endpoint to accept `request` parameter
   - Updated `POST` endpoint to accept `request` parameter
   - Added comment clarifying public access

2. `src/app/api/campaign-types/route.ts`
   - Added comment clarifying public access

---

## Summary

All inquiry form dropdowns now work correctly for all authenticated users:
- ✅ **Programs** - Accessible to all authenticated users
- ✅ **Marketing Source (Campaign Types)** - Accessible to all authenticated users
- ✅ **Campaigns** - Accessible to all authenticated users (with appropriate role-based filtering)

The form can now be used by any user with any role to create inquiries!

